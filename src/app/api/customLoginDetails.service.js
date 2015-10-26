
(function() {
  'use strict';

  angular
    .module('missionhub.api')
    .factory('customLoginDetails', customLoginDetailsService);

  /** @ngInject */
  function customLoginDetailsService($window) {
    var tokenStorageKey = 'facebook_token';

    return {
      token: token
    };

    function token(value) {
      if(value !== undefined) {
        if(value) {
          $window.localStorage.setItem(tokenStorageKey, value);
        }else{
          $window.localStorage.removeItem(tokenStorageKey);
        }
      }else{
        return $window.localStorage.getItem(tokenStorageKey);
      }
    }
  }
})();
