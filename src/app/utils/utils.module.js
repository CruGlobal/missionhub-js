(function() {
  'use strict';

  angular
    .module('missionhub.api.utils', [
      'LocalStorageModule',
      'change-case',
      'lokijs',
      'rx',
      'restangular',

      'missionhub.api.config'
    ]);

})();
