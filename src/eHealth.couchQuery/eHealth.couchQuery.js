// Create all modules and define dependencies to make sure they exist
// and are loaded in the correct order to satisfy dependency injection
// before all nested files are concatenated by Grunt

// Config
angular.module('eHealth.couchQuery.config', [])
  .value('eHealth.couchQuery.config', {
    debug: true
  });

// Modules
angular.module('eHealth.couchQuery.directives', []);
angular.module('eHealth.couchQuery.filters', []);
angular.module('eHealth.couchQuery.services', []);
angular.module('eHealth.couchQuery', [
  'ngLodash',
  'eHealth.couchQuery.config',
  'eHealth.couchQuery.directives',
  'eHealth.couchQuery.filters',
  'eHealth.couchQuery.services'
]);
