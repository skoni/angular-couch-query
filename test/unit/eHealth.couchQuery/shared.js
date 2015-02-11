function paginatedResultInterface(context) {
  describe('the paginated result', function() {
    var result;
    beforeEach(function() {
      result = context.result;
    });
    it('is defined', function(){
      expect(result).toBeDefined();
    });
    it('has not previous page at the beginning', function() {
      expect(result.hasPrevious).toBe(false);
    });
    it('allows to get parameters', function() {
      var params = result.parameters();
      expect(params.limit).toEqual(jasmine.any(Number));
      expect(params.skip).toBe(0);
    });
    it('just sets descending when no keys are given', function(){
      result.setDescending(true);
      expect(result.parameters().startkey).toBeUndefined();
      expect(result.parameters().endkey).toBeUndefined();
    });
    it('flips existing keys when changing descending', function(){
      result.parameters({
        startkey: 'start',
        endkey: 'end'
      });
      result.setDescending(true);
      expect(result.parameters()).toEqual({
        startkey: 'end',
        endkey: 'start',
        descending: true,
        limit : 20,
        skip : 0
      });
      result.setDescending(false);
      expect(result.parameters()).toEqual({
        startkey: 'start',
        endkey: 'end',
        descending: false,
        limit : 20,
        skip : 0
      });
    });
    describe('the expected property', function() {
      [
        'rows',
        'firstIndex',
        'lastIndex',
        'totalRows',
        'next',
        'previous',
        'hasNext',
        'hasPrevious'
      ].forEach(function(property) {
        it(property+' is there', function() {
          expect(result[property]).toBeDefined();
        });
      });
    });
    describe('on page size change', function() {
      beforeEach(function(){
        result.setPageSize(20);
      });
      it('starts again from the beginning', function(){
        expect(result.firstIndex).toBe(0);
      });
    });
    describe('on parameters set', function() {
      beforeEach(function() {
        spyOn(result, 'update').andCallThrough();
        result.parameters({ descending:true });
      });
      it('saves the new parameters', function() {
        expect(result.parameters().descending).toBe(true);
      });
      it('triggers an update', function() {
        expect(result.update).toHaveBeenCalled();
      });
    });
    describe('on parameters set with a direct interface', function() {
      beforeEach(function() {
        spyOn(result, 'update').andCallThrough();
        result.setParameter('descending', true);
      });
      it('saves the new parameters', function() {
        expect(result.parameters().descending).toBe(true);
      });
      it('keeps the old parameters', function() {
        expect(result.parameters().skip).toBe(0);
      });
      it('triggers an update', function() {
        expect(result.update).toHaveBeenCalledWith();
      });
    });
  });
}
