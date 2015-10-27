(function() {
  'use strict';

  angular
    .module('missionhub.api', [
      'restangular',

      'missionhub.api.cache',
      'missionhub.api.filters',
      'missionhub.api.utils'
    ]);

})();

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
    peopleService.$inject = ["$log", "mhResource"];

})();

(function() {
  'use strict';

  angular
    .module('missionhub.api')
    .factory('organizations', organizationsService);

  function organizationsService(userDetails, Restangular) {
    var factory = {
      getCurrentOrganization: getCurrentOrganization,
      getOrganizations: getOrganizations
    };
    return factory;

    /*function getCurrentOrgOld(org) {
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
    }*/

    function getCurrentOrganization(){
      return Restangular.one('organizations', userDetails.getCurrentOrganization()).get().then(function (data){
        return data.organization;
      });
    }

    function getOrganizations(options) {
      return Restangular.all('organizations').customGET().then(function (data){
        return data.organizations;
      });
    }
  }
  organizationsService.$inject = ["userDetails", "Restangular"];

})();

(function() {
  'use strict';

  angular
    .module('missionhub.api')
    .factory('interactions', interactionsService);

    function interactionsService(mhResource) {
      var factory = {
        getInteractions: getInteractions,
        getInteractionsForPerson: getInteractionsForPerson
      };
      return factory;

      function getInteractions(options) {
        return mhResource.mhResource('interactions', options);
      }

      function getInteractionsForPerson(id) {
        var filters = {'filters[people_ids]': id};
        var includes = ['initiators', 'interaction_type', 'receiver', 'creator', 'last_updater'];
        var options = angular.extend({include: includes.join()}, filters);
        return getInteractions(options);
      }
    }
    interactionsService.$inject = ["mhResource"];

})();

(function() {
  'use strict';

  angular
    .module('missionhub.api.utils', [
      'ngResource',
      'LocalStorageModule'
    ]);

})();


(function() {
  'use strict';

  angular
    .module('missionhub.api.utils')
    .factory('userDetails', userDetailsService);

  /** @ngInject */
  function userDetailsService(localStorageService) {
    var factory =  {
      getFirstName: getFirstName,
      setFirstName: setFirstName,
      getLastName: getLastName,
      setLastName: setLastName,
      getPersonId: getPersonId,
      setPersonId: setPersonId,
      getProfilePicture: getProfilePicture,
      setProfilePicture: setProfilePicture,
      getCurrentOrganization: getCurrentOrganization,
      setCurrentOrganization: setCurrentOrganization,
      clearAll: clearAll
    };
    return factory;

    function getFirstName(){
      return localStorageService.get('firstName');
    }

    function setFirstName(value){
      return localStorageService.set('firstName', value);
    }

    function getLastName(){
      return localStorageService.get('lastName');
    }

    function setLastName(value){
      return localStorageService.set('lastName', value);
    }

    function getPersonId(){
      return localStorageService.get('personId');
    }

    function setPersonId(value){
      return localStorageService.set('personId', value);
    }

    function getProfilePicture(){
      return localStorageService.get('profilePicture');
    }

    function setProfilePicture(value){
      return localStorageService.set('profilePicture', value);
    }

    function getCurrentOrganization(){
      return localStorageService.get('currentOrganization');
    }

    function setCurrentOrganization(value){
      return localStorageService.set('currentOrganization', value);
    }

    function clearAll(){
      localStorageService.clearAll();
    }
  }
  userDetailsService.$inject = ["localStorageService"];
})();


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
  mhResourceService.$inject = ["$resource", "customLoginDetails"];
})();


(function() {
  'use strict';

  angular
    .module('missionhub.api.utils')
    .factory('customLoginDetails', customLoginDetailsService);

  /** @ngInject */
  function customLoginDetailsService($window) {
    var tokenStorageKey = 'facebook_token';

    return {
      token: token
    };

    function token(value) {
      if(value !== undefined) {
        if(value) {
          $window.localStorage.setItem(tokenStorageKey, value);
        }else{
          $window.localStorage.removeItem(tokenStorageKey);
        }
      }else{
        return $window.localStorage.getItem(tokenStorageKey);
      }
    }
  }
  customLoginDetailsService.$inject = ["$window"];
})();

(function() {
  'use strict';

  angular
    .module('missionhub.api.filters', []);

})();

(function() {
  'use strict';

  angular
    .module('missionhub.api.filters')
    .filter('tel', tel);

  /** @ngInject */
  function tel() {
    return function (tel) {
      if (!tel) { return ''; }

      var value = tel.toString().trim().replace(/^\+/, '');

      if (value.match(/[^0-9]/)) {
        return tel;
      }

      var country, city, number;

      switch (value.length) {
        case 10: // +1PPP####### -> C (PPP) ###-####
          country = 1;
          city = value.slice(0, 3);
          number = value.slice(3);
          break;

        case 11: // +CPPP####### -> CCC (PP) ###-####
          country = value[0];
          city = value.slice(1, 4);
          number = value.slice(4);
          break;

        case 12: // +CCCPP####### -> CCC (PP) ###-####
          country = value.slice(0, 3);
          city = value.slice(3, 5);
          number = value.slice(5);
          break;

        default:
          return tel;
      }

      if (country === 1) {
        country = "";
      }

      number = number.slice(0, 3) + '-' + number.slice(3);

      return (country + " (" + city + ") " + number).trim();
    };
  }
})();

(function() {
  'use strict';

  angular
    .module('missionhub.api.filters')
    .filter('surveyName', surveyName);

  /** @ngInject */
  function surveyName(api, lodash) {
    return function (answerSheet) {
      if (!answerSheet) {
        return '';
      }

      var currentOrg = api.currentOrg();
      var survey = lodash.find(currentOrg.surveys, {id: answerSheet.survey_id});

      return lodash.result(survey, 'title', '');
    };
  }
  surveyName.$inject = ["api", "lodash"];
})();

(function() {
  'use strict';

  angular
    .module('missionhub.api.filters')
    .filter('personPrimaryPhone', personPrimaryPhone);

  /** @ngInject */
  function personPrimaryPhone() {
    return function (person) {

      if (!person || !person.phone_numbers || person.phone_numbers.length === 0) {
        return '';
      }
      var i = 0;
      while (i < person.phone_numbers.length) {
        if(person.phone_numbers[i].primary){
          return person.phone_numbers[i].number;
        }
        i++;
      }
      return person.phone_numbers[0].number;
    };
  }
})();

(function() {
  'use strict';

  angular
    .module('missionhub.api.filters')
    .filter('personFullname', personFullname);

  /** @ngInject */
  function personFullname() {
    return function(person) {
      if (!person || !person.first_name) {
        return '';
      }
      return person.first_name + ' ' + person.last_name;
    };
  }
})();

(function() {
  'use strict';

  angular
    .module('missionhub.api.filters')
    .filter('personAvatar', personAvatar);

  /** @ngInject */
  function personAvatar() {
    return function (person, size) {
      size = size || 40;

      if (!person || !person.first_name) {
        return '';
      }
      if (person.picture) {
        return person.picture + '?width=' + size + '&height=' + size;
      }

      // from http://stackoverflow.com/a/16348977/879524
      var colour = '444444';
      // str to hash
      for (var i = 0, hash = 0; i < person.first_name.length; hash = person.first_name.charCodeAt(i++) + ((hash << 5) - hash));
      // int/hash to hex
      for (var i = 0, colour = ""; i < 3; colour += ("00" + ((hash >> i++ * 8) & 0xFF).toString(16)).slice(-2));

      return "https://avatars.discourse.org/letter/" + person.first_name.slice(0, 1) + "/" + colour +
        "/" + size + ".png";
    };
  }
})();

(function() {
  'use strict';

  angular
    .module('missionhub.api.filters')
    .filter('interactionPrimaryInitiator', interactionPrimaryInitiator);

  /** @ngInject */
  function interactionPrimaryInitiator() {
    return function (interaction) {
      if (!interaction) {
        return {};
      }

      if (interaction.initiators[0]) {
        return interaction.initiators[0];
      } else if (interaction.creator) {
        return interaction.creator;
      }

      return {};
    };
  }
})();

(function() {
  'use strict';

  angular
    .module('missionhub.api.filters')
    .filter('googleMapsAddress', googleMapsAddress);

  /** @ngInject */
  function googleMapsAddress() {
    return function (address) {
      var mailingAddress = 'http://maps.google.com/maps?q=';

      if (address.address1) {
        mailingAddress += address.address1 + '+';
      }

      if (address.address2) {
        mailingAddress += address.address2 + '+';
      }

      if (address.city) {
        mailingAddress += address.city + ',+';
      }

      if (address.state) {
        mailingAddress += address.state + '+';
      }

      if (address.country) {
        mailingAddress += address.country;
      }

      //remove trailing <br/>
      if (mailingAddress.lastIndexOf('+') === mailingAddress.length - 1) {
        mailingAddress = mailingAddress.slice(0, -1);
      }

      return mailingAddress;
    };
  }
})();

(function() {
  'use strict';

  angular
    .module('missionhub.api.filters')
    .filter('backgroundStyle', backgroundStyle);

  /** @ngInject */
  function backgroundStyle() {
    return function (url) {
      return 'background-image: url(' + url + ')';
    };
  }
})();

(function() {
  'use strict';

  angular
    .module('missionhub.api.cache', []);

})();

(function() {
  'use strict';

  angular
    .module('missionhub.api.cache')
    .factory('personCache', personCacheService);

  /** @ngInject */
  function personCacheService() {
    // set up variables and constants
    var cachedPeople = {};

    // define methods

    // if you give person() a person object, it will cache it.
    // if you give it an id, it will return a person object if it has it.
    function person(newValue) {
      if (newValue.id) {
        cachedPeople[newValue.id] = cachedPeople[newValue.id] || {};
        angular.merge(cachedPeople[newValue.id], newValue);
        return true;
      }
      return cachedPeople[newValue];
    }

    // return interface
    return {
      person: person
    };
  }
})();

(function() {
  'use strict';

  angular
    .module('missionhub.api.cache')
    .factory('organizationCache', organizationCacheService);

  /** @ngInject */
  function organizationCacheService() {
    // set up variables and constants
    var cachedOrganizations = {};

    // define methods

    // if you give person() a person object, it will cache it.
    // if you give it an id, it will return a person object if it has it.
    function organization(newValue) {
      if (newValue.id) {
        cachedOrganizations[newValue.id] = cachedOrganizations[newValue.id] || {};
        angular.merge(cachedOrganizations[newValue.id], newValue);
        return true;
      }
      return cachedOrganizations[newValue];
    }

    // return interface
    return {
      organization: organization
    };
  }
})();

(function() {
  'use strict';

  angular
    .module('missionhub.api.cache')
    .factory('organizationListCache', organizationListCacheService);

  /** @ngInject */
  function organizationListCacheService() {
    var cachedOrganizationList = [];

    function list(newList) {
      if (newList && newList.length) {
        // don't override cache if list is empty
        if (newList.length === 0) {
          return cachedOrganizationList.length === 0;
        }
        cachedOrganizationList = [];
        angular.merge(cachedOrganizationList, newList);
        return true;
      }
      return angular.extend([], cachedOrganizationList);
    }

    return {
      list: list
    };
  }
})();


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

    apiService.$inject = ["mhResource", "people", "organizations", "interactions"];
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
  apiProvider.$inject = ["apiConfig", "RestangularProvider"];

})();

(function() {
  'use strict';

  angular
    .module('missionhub.api')
    .constant('apiConfig', {baseUrl: '/'});

})();

(function() {
  'use strict';

  angular
    .module('missionhub.api')
    .config(config);

  /** @ngInject */
  function config(localStorageServiceProvider) {
    localStorageServiceProvider.setPrefix('mh.user');
  }
  config.$inject = ["localStorageServiceProvider"];

})();
