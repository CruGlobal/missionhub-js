(function() {
  'use strict';

  angular
    .module('missionhub.api')
    .provider('api', apiProvider);

  function apiProvider(apiConfig) {
    var providerFactory = {
      $get: apiService
    };

    Object.defineProperties(providerFactory, {
      baseUrl: {
        get: function () {
          return apiConfig.baseUrl;
        },
        set: function (value) {
          apiConfig.baseUrl = value;
        }
      }
    });

    return providerFactory;

    /** @ngInject */
    function apiService($rootScope, $resource, $q, $log, customLoginDetails, personCache, organizationCache, organizationListCache) {
      var model = {};

      // return interface
      var factory = {
        currentPerson: currentPerson,
        currentOrg: currentOrg,
        people: {
          get: getPeople,
          getMe: getMe,
          getPersonWithEverything: getPersonWithEverything,
          getPersonWithInfo: getPersonWithInfo,
          getPersonWithSurveyAnswers: getPersonWithSurveyAnswers
        },
        interactions: {
          get: getInteractions,
          getInteractionsForPerson: getInteractionsForPerson
        },
        organizations: {
          get: getOrganizations
        }
      };
      return factory;

      function mhResource(endpoint, options) {
        if (!facebook_token()) {
          var deferred = $q.defer();
          deferred.resolve({endpoint: []});
          return deferred.promise;
        } else {
          if (model.currentOrgId && endpoint !== 'organizations') {
            angular.extend(options, {'organization_id': model.currentOrgId});
          }
          return $resource(providerFactory.baseUrl + endpoint + '/:id', {
            id: '@id',
            facebook_token: facebook_token()
          }).get(options).$promise;
        }
      }

      function facebook_token() {
        return customLoginDetails.token();
      }

      function currentPerson() {
        return personCache.person(model.currentPersonId);
      }

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

      //define methods
      function getMe() {
        var includes = ['all_organization_and_children', 'all_organizational_permissions', 'user', 'organizational_permission', 'permission', 'organizational_labels', 'label', 'interactions', 'email_addresses', 'phone_numbers', 'addresses'];
        var mePromise = $q.defer();
        getPeople({id: 'me', include: includes.join()})
          .then(function (data) {
            var me = data.person;
            model.currentPersonId = me.id;
            personCache.person(me);
            organizationListCache.list(me.all_organization_and_children);
            currentOrg({id: me.user.primary_organization_id}).then(function () {
              mePromise.resolve(me);
            }, function (error) {
              mePromise.reject(error);
            });
          }, function (error) {
            $log.error('Requesting your data failed due to: ' + error);
            mePromise.reject(error);
          });
        return mePromise.promise;
      }

      function getPeople(options) {
        var promise = mhResource('people', options);
        promise.then(function (data) {
          // save to cache now
          angular.forEach(data.people, function (person) {
            personCache.person(person);
          });
        });
        return promise;
      }

      function getPersonWithInfo(id) {
        var includes = ['organizational_permission', 'permission', 'organizational_labels', 'label', 'email_addresses', 'phone_numbers', 'addresses'];
        return getPeople({id: id, include: includes.join()});
      }

      function getPersonWithSurveyAnswers(id) {
        var includes = ['answer_sheets', 'answers'];
        return getPeople({id: id, include: includes.join()});
      }

      function getPersonWithEverything(id) {
        var includes = ['organizational_permission', 'permission', 'organizational_labels', 'label', 'email_addresses', 'phone_numbers', 'addresses', 'answer_sheets', 'answers', 'interactions', 'interaction_type'];
        return getPeople({id: id, include: includes.join()});
      }

      function getInteractions(options) {
        return mhResource('interactions', options);
      }

      function getInteractionsForPerson(id) {
        var filters = {'filters[people_ids]': id};
        var includes = ['initiators', 'interaction_type', 'receiver', 'creator', 'last_updater'];
        var options = angular.extend({include: includes.join()}, filters);
        return getInteractions(options);
      }

      function getOrganizations(options) {
        return mhResource('organizations', options);
      }
    }
  }

})();
