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
    function apiService(Restangular, jsonapi, people, organizations) {
      var factory = {
        baseUrl: providerFactory.baseUrl, //TODO: remove if not needed

        people: {
          all: people.all,
          current: people.current,
          get: people.get/*,
          getMe: peopleEndpoint.getMe,
          getPersonWithEverything: peopleEndpoint.getPersonWithEverything,
          getPersonWithInfo: peopleEndpoint.getPersonWithInfo,
          getPersonWithSurveyAnswers: peopleEndpoint.getPersonWithSurveyAnswers*/
        },
        /*interactions: {
          get: interactions.getInteractions,
          getInteractionsForPerson: interactions.getInteractionsForPerson
        },*/
        organizations: {
          all: organizations.all,
          current: organizations.current
        }
      };

      activate();

      function activate(){
        Restangular.addResponseInterceptor(function(data, operation, what, url) {
          return jsonapi.deserialize(data, url);
        });
      }

      return factory;
    }
  }

})();
