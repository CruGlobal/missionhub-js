(function() {
  'use strict';

  angular
    .module('missionhub.api', [
      'restangular',

      'missionhub.api.config',
      'missionhub.api.cache',
      'missionhub.api.filters',
      'missionhub.api.utils'
    ]);

})();
