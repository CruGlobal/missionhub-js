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
    function apiService(mhResource, people, organizations, interactions) {
      var factory = {
        baseUrl: providerFactory.baseUrl,

        currentPerson: people.currentPerson,
        currentOrg: organizations.currentOrg,
        people: {
          get: people.getPeople,
          getMe: people.getMe,
          getPersonWithEverything: people.getPersonWithEverything,
          getPersonWithInfo: people.getPersonWithInfo,
          getPersonWithSurveyAnswers: people.getPersonWithSurveyAnswers
        },
        interactions: {
          get: interactions.getInteractions,
          getInteractionsForPerson: interactions.getInteractionsForPerson
        },
        organizations: {
          get: organizations.getOrganizations
        }
      };

      activate();

      function activate(){
        mhResource.setBaseUrl(factory.baseUrl);
      }

      return factory;
    }
  }

})();
