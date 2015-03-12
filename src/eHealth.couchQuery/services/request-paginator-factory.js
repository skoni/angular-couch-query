'use strict';

angular
  .module('eHealth.couchQuery.services')
  .provider('requestPaginatorFactory', function () {
    var viewPageSize = 20;
    this.setPageSize = function(newViewPageSize) {
      viewPageSize = newViewPageSize;
    };
    this.$get = ['lodash', '$q', function(lodash, $q) {
      function updateResult(response, skip, size, result, transform, options) {
        transform = transform || function (i) { return i; }; // identity
        var rows, totalRows = 0;
        if (response.rows) {
          // response from couchdb
          rows = response.rows;
          totalRows = response.total_rows;
        }
        else if (response.hits) {
          // response from elasticsearch
          rows = response.hits.hits.map(function(hit) { return hit._source; });
          totalRows = response.hits.total;
        }
        if (options.unique) {
          rows = lodash.uniq(rows, function(row){ return row.id || row._id; });
        }
        result.rows = rows.map(transform);
        result.totalRows = totalRows;
        result.firstIndex = skip;
        result.lastIndex = result.firstIndex + result.rows.length - 1;
        result.hasPrevious = (skip > 0);
        result.hasNext = ((skip + result.rows.length) < result.totalRows);
        return result;
      }
      function requestPaginatorFactory(query, params, options) {
        params = params || {};
        options = options || {};
        var page = 0,
            size = options.pageSize || viewPageSize,
            transform;
        params = angular.copy(params);
        var result = {
          hasPrevious: false,
          hasNext: false,
          update: function() {
            var skip = page * size;
            if (options.searchEngine === 'elasticsearch') {
              params.size = size;
              params.from = skip;
            }
            else {
              params.limit = size;
              params.skip = skip;
            }
            return query(params)
              .then(function(response) {
                return updateResult(
                  response,
                  skip,
                  size,
                  result,
                  transform,
                  options
                );
              });
          },
          next: function() {
            if (result.lastIndex < result.totalRows) {
              page++;
              result.update();
            }
          },
          previous: function() {
            if (page > 0) {
              page--;
              result.update();
            }
          },
          setPageSize: function(newSize) {
            size = newSize;
            page = 0;
            return result.update();
          },
          parameters: function(newParams) {
            if (newParams) {
              params = newParams;
              return result.update();
            } else {
              return angular.copy(params);
            }
          },
          setParameter: function(key, value) {
            params[key] = value;
            return result.update();
          },
          setDescending: function(value) {
            var prev = params.descending;
            params.descending = value;
            if (value == prev) {
              return $q.when(result);
            } else {
              var start = params.startkey,
                  end   = params.endkey;
              if(start) {
                params.endkey = start;
              }
              if (end) {
                params.startkey = end;
              }
              return result.update();
            }
          },
          transform: function(f) {
            transform = f;
            result.rows = result.rows.map(f);
          }
        };
        return result.update();
      }
      // expose just for tests
      requestPaginatorFactory.updateResult = updateResult;
      return requestPaginatorFactory;
    }];
  });
