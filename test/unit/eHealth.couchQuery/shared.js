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
  });
}
