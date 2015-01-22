'use strict';

angular.module('eHealth.couchQuery.services')
  .factory('foldToAscii', function () {
    return function(s) {
      if (s) {
        return foldToASCII(s);
      } else {
        return s;
      }
    };
  });
