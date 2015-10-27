(function() {
  'use strict';

  angular
    .module('missionhub.api', [
      'restangular',

      'missionhub.api.cache',
      'missionhub.api.filters',
      'missionhub.api.utils'
    ]);

})();
