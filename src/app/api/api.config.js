(function() {
  'use strict';

  angular
    .module('missionhub.api')
    .config(config);

  /** @ngInject */
  function config(localStorageServiceProvider) {
    localStorageServiceProvider.setPrefix('mh.user');
  }

})();
