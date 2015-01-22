'use strict';

describe('Service: foldToAscii', function () {

  // load the service's module
  beforeEach(module('eHealth.couchQuery'));

  // instantiate service
  var foldToAscii;
  beforeEach(inject(function (_foldToAscii_) {
    foldToAscii = _foldToAscii_;
  }));

  it('folds to ASCII', function () {
    expect(foldToAscii('àé')).toBe('ae');
  });
  it('ignores undefined strings', function() {
    expect(foldToAscii()).toBe(undefined);
  });
});
