'use strict';

describe('Service: luceneQueryFactory', function () {

  // load the service's module
  beforeEach(module('eHealth.couchQuery'));

  beforeEach(module(function(luceneQueryFactoryProvider) {
    luceneQueryFactoryProvider.setDb('https://dev.couchdb.ebola.eocng.org/sl_call_centre');
    luceneQueryFactoryProvider.setSearchDocument('search-version:0.1.1/all');
  }));

  // instantiate service
  var luceneQueryFactory,
      query,
      $rootScope,
      $http = {
        def: {}
      },
      host = 'https://dev.couchdb.ebola.eocng.org',
      couchdbLuceneUrlRe = new RegExp(host+'/...?_call_centre/_fti/_design/search-version:\\d\\.\\d\\.\\d/all'),
      elasticsearchUrlRe = new RegExp('.*/_search'),
      emptyResponse = {
        data: {
          rows: [],
          total_rows: 0
        }
      },
      context = {};
  beforeEach(module(function($provide) {
    $provide.value('$http', $http);
  }));
  beforeEach(inject(function (_luceneQueryFactory_, _$rootScope_, $q) {
    luceneQueryFactory = _luceneQueryFactory_;
    $rootScope = _$rootScope_;
    $http.def.get = $q.defer();
    $http.get = function() {
      return $http.def.get.promise;
    };
    spyOn($http, 'get').andCallThrough();
  }));

  it('creates a Lucene query', function () {
    var created = luceneQueryFactory.create();
    expect(created).toBeDefined();
  });
  it('folds a free search', function() {
    expect(luceneQueryFactory
           .create()
           .searchFree('è')
           .getSearchExpression())
      .toBe('e');
  });

  describe('an empty query', function() {
    beforeEach(function() {
      query = luceneQueryFactory.create();
    });
    it('defaults to a view when run', function(){
      var response;
      query.run().then(function(_response_) {
        response = _response_;
      });
      expect($http.get.mostRecentCall.args[0])
        .toMatch(host+'/...?_call_centre/_design/frontend/_view/by_contact_createdon');
      expect($http.get.mostRecentCall.args[1])
        .toEqual({
          withCredentials: true,
          params: {include_docs: true, limit : 20, skip : 0 }
        });
      $http.def.get.resolve(emptyResponse);
      $rootScope.$digest();
      expect(response).toBeDefined();
    });
  });
  describe('a query on a field', function() {
    beforeEach(function() {
      query = luceneQueryFactory.create().searchField('phone_number', '1234');
    });
    it('searches on its field', function() {
      expect(query.getSearchExpression())
        .toBe('phone_number:"1234"');
    });
    describe('combined with a free text search', function() {
      beforeEach(function() {
        query.searchFree('free text');
      });
      it('adds the free text', function() {
        expect(query.getSearchExpression())
          .toBe('phone_number:"1234" AND free text');
      });
      it('allows to change the field', function(){
        query.searchField('phone_number', '5678');
        expect(query.getSearchExpression())
          .toBe('phone_number:"5678" AND free text');
      });
      it('allows to change the free text', function(){
        query.searchFree('changed my mind');
        expect(query.getSearchExpression())
          .toBe('phone_number:"1234" AND changed my mind');
      });
      it('allows to clear the field', function(){
        query.clearField('phone_number');
        expect(query.getSearchExpression())
          .toBe('free text');
      });
      it('clears the field when set to undefined', function(){
        query.searchField('phone_number', undefined);
        expect(query.getSearchExpression())
          .toBe('free text');
      });
      it('allows to clear the free search', function(){
        query.clearFree();
        expect(query.getSearchExpression())
          .toBe('phone_number:"1234"');
      });
    });
  });
  describe('a free text query with couchdb-lucene', function() {
    beforeEach(function(){
      query = luceneQueryFactory.create().searchFree('free text');
    });
    it('does a free text search', function() {
      expect(query.getSearchExpression()).toBe('free text');
    });
    it('allows to combine field search ', function() {
      query
        .searchField('name', 'Franco')
        .searchField('region', 'B');
      expect(query.getSearchExpression())
        .toBe('name:"Franco" AND region:"B" AND free text');
    });
    it('runs against the endpoint', function() {
      var response;
      query.run().then(function(_response_) {
        response = _response_;
      });
      expect($http.get.mostRecentCall.args[0])
        .toMatch(couchdbLuceneUrlRe);
      expect($http.get.mostRecentCall.args[1])
        .toEqual({
          withCredentials: true,
          params: {
            q : 'free text',
            include_docs : true,
            limit : 20,
            skip : 0,
            stale : 'ok'
          }});
      $http.def.get.resolve(emptyResponse);
      $rootScope.$digest();
      expect(response).toBeDefined();
    });
    it('allows to search for a not-match, and clear it', function() {
      query.searchFieldNot('region', 'B');
      expect(query.getSearchExpression())
        .toBe('NOT region:"B" AND free text');
      query.clearField('region');
      expect(query.getSearchExpression())
        .toBe('free text');
    });
    describe('the returned object', function(){
      beforeEach(function(){
        query.run().then(function(_result_) {
          context.result = _result_;
        });
        $http.def.get.resolve(emptyResponse);
        $rootScope.$digest();
      });
      paginatedResultInterface(context);
    });
  });
  describe('a free text query with elasticsearch', function() {
    beforeEach(function(){
      query = luceneQueryFactory.create({searchEngine: 'elasticsearch'}).searchFree('free text');
    });
    it('runs against the endpoint', function() {
      var response;
      query.run().then(function(_response_) {
        response = _response_;
      });
      expect($http.get.mostRecentCall.args[0])
        .toMatch(elasticsearchUrlRe);
      expect($http.get.mostRecentCall.args[1])
        .toEqual({
          withCredentials: true,
          params: {
            q : 'free text',
            size : 20,
            from : 0
          }});
      $http.def.get.resolve(emptyResponse);
      $rootScope.$digest();
      expect(response).toBeDefined();
    });
  });
  describe('a query with a sort field for couchdb-lucene', function(){
    beforeEach(function(){
      query = luceneQueryFactory.create({ sortField:'date' });
    });
    it('uses view sorting for empty searches', function(){
      query.run({ descending:true });
      expect($http.get.mostRecentCall.args[1].params)
        .toEqual({
          descending : true,
          include_docs : true,
          limit : 20,
          skip : 0
        });
    });
    describe('for text searches', function(){
      beforeEach(function(){
        query.searchField('name', 'Jonny');
      });
      it('uses Lucene sorting', function(){
        query.run({ descending:true });
        expect($http.get.mostRecentCall.args[1].params)
          .toEqual({
            include_docs : true,
            q : 'name:"Jonny"',
            sort : '\\date',
            limit : 20,
            skip : 0,
            stale: 'ok'
          });
      });
      it('considers the descending parameter', function(){
        query.run({ descending:false });
        expect($http.get.mostRecentCall.args[1].params)
          .toEqual({
            include_docs : true,
            q : 'name:"Jonny"',
            sort : '/date',
            limit : 20,
            skip : 0,
            stale : 'ok'
          });
      });
      it('can sort by several fields', function() {
        query = luceneQueryFactory.create({ sortField:['date', 'name']});
        query.searchField('name', 'Jonny');
        query.run();
        expect($http.get.mostRecentCall.args[1].params)
          .toEqual({
            include_docs : true,
            q : 'name:"Jonny"',
            stale: 'ok',
            sort : '/date,/name',
            limit : 20,
            skip : 0
          });
      });
    });
  });
  describe('a query with a sort field for elasticsearch', function(){
    beforeEach(function(){
      query = luceneQueryFactory.create({ sortField:'date', searchEngine: 'elasticsearch' });
    });
    it('uses view sorting for empty searches', function(){
      query.run({ descending:true });
      expect($http.get.mostRecentCall.args[1].params)
        .toEqual({
          descending : true,
          include_docs : true,
          limit : 20,
          skip : 0
        });
    });
    describe('for text searches', function(){
      beforeEach(function(){
        query.searchField('name', 'Jonny');
      });
      it('uses elasticsearch sorting', function(){
        query.run({ descending:true });
        expect($http.get.mostRecentCall.args[1].params)
          .toEqual({
            q : 'name:"Jonny"',
            sort : 'date:desc',
            size : 20,
            from : 0
          });
      });
      it('considers the descending parameter', function(){
        query.run({ descending:false });
        expect($http.get.mostRecentCall.args[1].params)
          .toEqual({
            q : 'name:"Jonny"',
            sort : 'date:asc',
            size : 20,
            from : 0
          });
      });
      it('can sort by several fields', function() {
        query = luceneQueryFactory.create({
          sortField:['date', 'name'],
          searchEngine: 'elasticsearch'
        });
        query.searchField('name', 'Jonny');
        query.run();
        expect($http.get.mostRecentCall.args[1].params)
          .toEqual({
            q : 'name:"Jonny"',
            sort : 'date:asc,name:asc',
            size : 20,
            from : 0
          });
      });
    });
  });
  describe('with a fine grain field', function() {
    beforeEach(function(){
      query = luceneQueryFactory.create({
        fineGrainFields: {
          status: ['new', 'in progress', 'done']
        }
      });
    });
    describe('with a negative condition', function() {
      beforeEach(function(){
        query.searchFieldNot('status', 'done');
      });
      it('expresses the condition in terms of positive matches', function(){
        expect(query.getSearchExpression())
          .toBe('status:("new" OR "in progress")');
      });
      it('adds the free text', function() {
        query.searchField('moon', 'full');
        expect(query.getSearchExpression())
          .toBe('status:("new" OR "in progress") AND moon:"full"');
      });
      it('does not cumulate negative conditions', function(){
        query.searchFieldNot('status', 'new');
        expect(query.getSearchExpression())
          .toBe('status:("in progress" OR "done")');
      });
      it('allows to clear the field', function(){
        query.clearField('status');
        expect(query.getSearchExpression()).toBe('');
      });
    });
  });
  describe('a query that match one of multiple key value pairs (eitherOr query)', function() {
    it ('generates the expected expression with simple fields', function() {
      query.searchFieldEitherOr('createdBy', {
        'contact_createdby_username': 'username',
        'contact_createdby': 'name',
        'createdby': 'username'});
      expect(query.getSearchExpression())
        .toBe('(contact_createdby_username:"username" OR contact_createdby:"name" OR createdby:"username")');
    });
    it ('generates the expected expression with multiple fields', function() {
      var users = ['user1', 'user2'];
      query.searchFieldEitherOr('createdBy', {
        'contact_createdby_username': users,
        'contact_createdby': users
      });
      expect(query.getSearchExpression())
        .toBe('(contact_createdby_username:("user1" OR "user2") OR contact_createdby:("user1" OR "user2"))');
    });
    it('doesn\'t add a search field when the value is undefined', function() {
      query.searchFieldEitherOr('createdBy', {
        'contact_createdby_username': undefined,
        'createdby': 'username'});
      expect(query.getSearchExpression())
        .toBe('(createdby:"username")');
    });
    it('resets the field when all values are undefined or []', function() {
      query.searchFieldEitherOr('createdBy', {
        'contact_createdby_username': undefined,
        'createdby': []});
      expect(query.getSearchExpression()).toBe('');
    });
    it('allows to clear the field', function(){
      query.searchFieldEitherOr('createdBy', {});
      expect(query.getSearchExpression()).toBe('');
    });
  });
  describe('a query on a field with multiple values', function(){
    beforeEach(function(){
      query.searchField('status', ['new', 'in progress']);
    });
    it('generates the expected expression', function(){
      expect(query.getSearchExpression())
        .toBe('status:("new" OR "in progress")');
    });
    it('can reset the field', function(){
      query.searchField('status', []);
      expect(query.getSearchExpression()).toBe('');
    });
  });
  describe('with a range field', function() {
    beforeEach(function(){
      query.rangeField('range', 'a', 'z');
    });
    it('generates the expected expression', function(){
      expect(query.getSearchExpression())
        .toBe('range:[a TO z]');
    });
    it('adds the free text', function() {
      query.searchField('moon', 'full');
      expect(query.getSearchExpression())
        .toBe('range:[a TO z] AND moon:"full"');
      query.clearField('moon');
    });
    it('allows to clear the field', function(){
      query.clearField('range');
      expect(query.getSearchExpression()).toBe('');
    });
  });
  describe('a query with paginator options', function() {
    it('passes the options on to the view paginator', function(){
      query = luceneQueryFactory.create({});
      query.run(null, {pageSize: 2});
      expect($http.get.mostRecentCall.args[1].params.limit).toEqual(2);
    });
    it('passes the options on to the index paginator', function(){
      query = luceneQueryFactory.create({}).searchFree('free');
      query.run(null, {pageSize: 2});
      expect($http.get.mostRecentCall.args[1].params.limit).toEqual(2);
    });
  });
});
