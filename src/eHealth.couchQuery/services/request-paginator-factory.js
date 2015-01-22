'use strict';

angular
  .module('eHealth.couchQuery.services')
  .provider('requestPaginatorFactory', function () {
    var viewPageSize = 20;
    this.setPageSize = function(newViewPageSize) {
      viewPageSize = newViewPageSize;
    };
    this.$get = ['lodash', function(lodash) {
      function updateResult(response, skip, size, result, transform, options) {
        transform = transform || function (i) { return i; }; // identity
        var rows;
        if (options.unique) {
          rows = lodash.uniq(response.rows, function(e){ return e.id; });
        } else {
          rows = response.rows;
        }
        result.rows = rows.map(transform);
        result.totalRows = response.total_rows;
        result.firstIndex = skip;
        result.lastIndex = result.firstIndex + size - 1;
        result.hasPrevious = false;
        result.hasNext = true;
        if (result.rows.length < size) {
          result.lastIndex = result.firstIndex + result.rows.length - 1;
          result.hasNext = false;
        }
        if (skip > 0) {
          result.hasPrevious = true;
        }
        return result;
      }
      function requestPaginatorFactory(query, params, options) {
        params = params || {};
        options = options || {};
        var page = 0,
            size = viewPageSize,
            transform;
        params = angular.copy(params);
        var result = {
          hasPrevious: false,
          hasNext: false,
          update: function() {
            var skip = page * size;
            params.limit = size;
            params.skip = skip;
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
