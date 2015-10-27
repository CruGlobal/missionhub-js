(function() {
  'use strict';

  angular
    .module('missionhub.api')
    .factory('organizations', organizationsService);

    function organizationsService($rootScope, $log, organizationCache, mhResource) {
      var model = {};

      var factory = {
        currentOrg: currentOrg,
        getOrganizations: getOrganizations
      };
      return factory;

      function currentOrg(org) {
        if (!org) {
          return organizationCache.organization(model.currentOrgId);
        }
        var includes = ['admins', 'users', 'surveys', 'labels', 'questions', 'interaction_types'];
        return getOrganizations({
          id: org.id,
          include: includes.join(),
          organization_id: org.id //please do not remove this line. The org request will break. This must be set so that the scope of the request is the organization with id = org.id. If you try to request an organization with a different id to organization_id it will return a 404. If organization_id is unset it will default to me.user.primary_organization_id which is fine for the first request but will prevent the user changing organizations
        })
          .then(function (data) {
            var org = data.organization;
            organizationCache.organization(org);
            if (model.currentOrgId !== org.id) {
              model.currentOrgId = org.id;
              $rootScope.$broadcast('current-org-updated', org);
            }
          }, function (error) {
            $log.error('Organization change failed because: ' + error.statusText);
          });
      }

      function getOrganizations(options) {
        return mhResource.mhResource('organizations', options);
      }
    }

})();
