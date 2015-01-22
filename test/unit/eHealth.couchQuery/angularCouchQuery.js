'use strict';

// Set the jasmine fixture path
// jasmine.getFixtures().fixturesPath = 'base/';

describe('', function() {

    var module;
    var dependencies;
    dependencies = [];

    var hasModule = function(module) {
        return dependencies.indexOf(module) >= 0;
    };

    beforeEach(function() {

        // Get module
        module = angular.module('eHealth.couchQuery');
        dependencies = module.requires;
    });

    it('should load config module', function() {
        expect(hasModule('eHealth.couchQuery.config')).toBeTruthy();
    });

    
    it('should load filters module', function() {
        expect(hasModule('eHealth.couchQuery.filters')).toBeTruthy();
    });
    

    
    it('should load directives module', function() {
        expect(hasModule('eHealth.couchQuery.directives')).toBeTruthy();
    });
    

    
    it('should load services module', function() {
        expect(hasModule('eHealth.couchQuery.services')).toBeTruthy();
    });
    

});
