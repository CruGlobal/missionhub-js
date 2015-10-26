(function() {
  'use strict';

  angular
    .module('missionhub.api', [
      'ngResource',

      'missionhub.api.cache',
      'missionhub.api.filters'
    ]);

})();
