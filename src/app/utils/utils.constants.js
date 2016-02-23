/* global window:false */
(function() {
  'use strict';

  angular
    .module('missionhub.api.utils')
    .constant('_', window._)
    .constant('deepDiff', window.DeepDiff)
    .constant('LokiIndexedAdapter', window.LokiIndexedAdapter);

})();
