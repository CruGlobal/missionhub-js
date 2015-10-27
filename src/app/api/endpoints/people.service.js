(function() {
  'use strict';

  angular
    .module('missionhub.api')
    .factory('people', peopleService);

    function peopleService($log, mhResource) {
      var model = {};

      var factory = {
        currentPerson: currentPerson,
        getMe: getMe,
        getPeople: getPeople,
        getPersonWithInfo: getPersonWithInfo,
        getPersonWithSurveyAnswers: getPersonWithSurveyAnswers,
        getPersonWithEverything: getPersonWithEverything
      };
      return factory;

      function currentPerson() {
        return personCache.person(model.currentPersonId);
      }

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
        var promise = mhResource.mhResource('people', options);
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
    }

})();
