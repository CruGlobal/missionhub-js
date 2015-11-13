(function() {
  'use strict';

  angular
    .module('missionhub.api')
    .config(config);

  /** @ngInject */
  function config(localStorageServiceProvider, RestangularProvider, jsonapiProvider) {
    localStorageServiceProvider.setPrefix('mh.user');

    RestangularProvider.addResponseInterceptor(function(data) {
      return jsonapiProvider.deserialize(data);
    });
  }

})();
