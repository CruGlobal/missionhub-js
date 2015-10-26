(function () {
  'use strict';

  describe('service api', function () {
    var self = {};

    beforeEach(module('missionhub.api'));

    beforeEach(function(){
      inject(function(api) {
        self.api = api;
      });
    });

    it('should be registered', function () {
      expect(self.api).toBeDefined();
    });
  });
})();

