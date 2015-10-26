(function() {
  'use strict';

  angular
    .module('missionhub.api')
    .factory('loginDetails', loginDetailsService);

  /** @ngInject */
  function loginDetailsService() {
    var tokenStorageKey = 'facebook_token';

    function token(value) {
      if(value !== undefined) {
        if(value) {
          localStorage.setItem(tokenStorageKey, value);
        }
        else {
          localStorage.removeItem(tokenStorageKey);
        }
      }
      else {
        return localStorage.getItem(tokenStorageKey);
      }
    }

    return {
      token: token
    };
  }
})();
