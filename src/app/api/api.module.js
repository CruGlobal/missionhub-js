(function() {
  'use strict';

  angular
    .module('missionhub.api', [
      'restangular',
      'lokijs',
      'rx',

      'missionhub.api.cache',
      'missionhub.api.filters',
      'missionhub.api.utils'
    ]);

})();
