/* global window:false */
(function() {
  'use strict';

  angular
    .module('missionhub.api')
    .constant('_', window._)
    .constant('apiConfig', {baseUrl: '/'});

})();
