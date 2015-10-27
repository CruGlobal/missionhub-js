(function() {
  'use strict';

  angular
    .module('missionhub.api')
    .provider('api', apiProvider);

  /** @ngInject */
  function apiProvider(apiConfig, RestangularProvider) {
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
          RestangularProvider.setBaseUrl(value);
        }
      }
    });

    return providerFactory;

    /** @ngInject */
    function apiService(mhResource, people, organizations, interactions) {
      var factory = {
        baseUrl: providerFactory.baseUrl, //TODO: remove if not needed

        currentPerson: people.currentPerson,
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
          all: organizations.getOrganizations,
          current: organizations.getCurrentOrganization
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
