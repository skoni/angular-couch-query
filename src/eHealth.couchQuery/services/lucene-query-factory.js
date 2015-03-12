'use strict';

angular
  .module('eHealth.couchQuery.services')
  .provider('luceneQueryFactory', function () {
    var db,
        searchDocument;
    this.setDb = function(newDb) {
      db = newDb;
    };
    this.setSearchDocument = function(newSearchDocument) {
      searchDocument = newSearchDocument;
    };
    this.$get = ['$http', 'requestPaginatorFactory', 'foldToAscii', function($http, requestPaginatorFactory, foldToAscii) {
      function create(options) {
        options = options || {};
        var fields = {};
        var free = false;
        var fineGrainFields = options.fineGrainFields || {};

        var engines = {
          runCouchDB: function(initialParams, initialOptions, q, config) {
            angular.extend(initialParams, {
              include_docs: true
            });
            initialOptions.type = 'couchdb';
            return requestPaginatorFactory(function(params) {
              config.params = params;
              return $http
                .get(db+'/_design/frontend/_view/by_contact_createdon', config)
                .then(function(response) {
                  return response.data;
                });
            }, initialParams, initialOptions);
          },
          runCouchDBLucene: function(initialParams, initialOptions, q, config) {
            angular.extend(initialParams, {
              q: q,
              include_docs: true
            });
            angular.extend(initialOptions, {
              unique: true
            });
            // when a new index is being calculated by couch-lucene,
            // all other indexes are blocked and return 500! accepting
            // stale results allows the application to work
            // continuously
            initialParams.stale = 'ok';
            if (options.sortField) {
              var direction = initialParams.descending ? '\\' : '/';
              initialParams.sort = angular.isArray(options.sortField) ?
                direction+options.sortField.join(',' + direction) :
                direction+options.sortField;
              delete initialParams.descending;
            }
            return requestPaginatorFactory(function(params) {
              config.params = params;
              return $http
                .get(db+'/_fti/_design/'+searchDocument, config)
                .then(function(response) {
                  return response.data;
                });
            }, initialParams, initialOptions);
          },
          runElasticsearch: function(initialParams, initialOptions, q, config) {
            angular.extend(initialParams, {
              q: q
            });
            angular.extend(initialOptions, {
              unique: true
            });
            if (options.sortField) {
              var direction = initialParams.descending ? 'desc' : 'asc';
              initialParams.sort = angular.isArray(options.sortField) ?
                options.sortField.join(':' + direction + ',') + ':' + direction :
                options.sortField + ':' + direction;
              delete initialParams.descending;
            }
            return requestPaginatorFactory(function(params) {
              config.params = params;
              // TODO: set correct URL with DB when we have a setup
              //       where couchdb proxies elasticsearch
              return $http
                .get(searchDocument, config)
                .then(function(response) {
                  return response.data;
                });
            }, initialParams, initialOptions);
          }
        };

        var query = {
          searchField: function(key, value) {
            fields[key] = {
              value: value
            };
            if (value === undefined || (angular.isArray(value) && !value.length)) {
              delete fields[key];
            }
            return query;
          },
          searchFieldEitherOr: function(key, value) {
            if (Object.keys(value).length) {
              fields[key] = {
                type: 'eitherOr',
                value: value,
              };
            } else {
              delete fields[key];
            }
            return query;
          },
          searchFieldNot: function(key, value) {
            function isNotValue(candidate) { return candidate !== value; }
            if (key in fineGrainFields) {
              fields[key] = {
                value: fineGrainFields[key].filter(isNotValue),
              };
            } else {
              query.searchField(key, value);
              fields[key].type = 'not';
            }
            return query;
          },
          rangeField: function(key, from, to) {
            if (from && to) {
              fields[key] = {
                type: 'range',
                from: from,
                to: to
              };
            } else {
              delete fields[key];
            }
            return query;
          },
          clearField: function(key) {
            delete fields[key];
            return query;
          },
          searchFree: function(value) {
            free = value;
            return query;
          },
          clearFree: function() {
            free = false;
            return query;
          },
          getSearchExpression: function() {
            var terms = Object.keys(fields).map(function (key) {
              var field = fields[key];

              function addLabel(key, value) {
                if (angular.isUndefined(value)) {
                  value = field.value;
                }
                var queryValue;
                if (angular.isArray(value)) {
                  queryValue = '(' + value.map(foldToAscii).map(function(v) {
                    return '"' + v + '"';
                  }).join(' OR ') + ')';
                }
                else {
                  queryValue = '"' + foldToAscii(value) + '"';
                }
                return key + ':' + queryValue;
              }

              switch(field.type) {
              case 'not':
                return 'NOT ' + addLabel(key);

              case 'eitherOr':
                var labeled = Object.keys(field.value).filter(function(k) {
                  // Filter undefined and empty array values
                  var val = field.value[k];
                  return angular.isDefined(val) &&
                         (!angular.isArray(val) || val.length > 0);
                }).map(function(k) {
                  return addLabel(k, field.value[k]);
                });
                return labeled.length ? '(' + labeled.join(' OR ') + ')' : '';

              case 'range':
                return key + ':[' + field.from + ' TO ' + field.to + ']';

              default:
                return addLabel(key);
              }
            });
            if (free) {
              terms.push(foldToAscii(free));
            }
            return terms.join(' AND ');
          },
          run: function(initialParams, initialOptions){
            initialParams = initialParams || {};
            initialOptions = initialOptions || {};
            var q = query.getSearchExpression();
            var config = {
              withCredentials: true
            };
            if (q === '') {
              initialOptions.searchEngine = 'couchdb';
              return engines.runCouchDB(initialParams, initialOptions, q, config);
            }
            else {
              initialOptions.searchEngine = options.searchEngine || 'couchdb-lucene';
              if (initialOptions.searchEngine === 'couchdb-lucene') {
                return engines.runCouchDBLucene(initialParams, initialOptions, q, config);
              }
              else if (initialOptions.searchEngine === 'elasticsearch') {
                return engines.runElasticsearch(initialParams, initialOptions, q, config);
              }
            }
          }
        };
        return query;
      }
      return {
        create: create
      };
    }];
  });
