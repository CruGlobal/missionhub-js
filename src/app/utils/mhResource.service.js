
(function() {
  'use strict';

  angular
    .module('missionhub.api.utils')
    .factory('mhResource', mhResourceService);

  /** @ngInject */
  function mhResourceService($resource, customLoginDetails) {
    var model = {};

    var factory =  {
      mhResource: mhResource,
      setBaseUrl: setBaseUrl
    };
    return factory;

    function setBaseUrl(value){
      model.baseUrl = value;
    }

    function mhResource(endpoint, options) {
      if (false && !facebook_token()) {
        var deferred = $q.defer();
        deferred.resolve({endpoint: []});
        return deferred.promise;
      } else {
        if (model.currentOrgId && endpoint !== 'organizations') {
          angular.extend(options, {'organization_id': model.currentOrgId});
        }
        return $resource(model.baseUrl + endpoint + '/:id', {
          id: '@id',
          facebook_token: facebook_token()
        }).get(options).$promise;
      }
    }

    function facebook_token() {
      return customLoginDetails.token();
    }
  }
})();
