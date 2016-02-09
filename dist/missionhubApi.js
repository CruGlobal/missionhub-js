(function() {
  'use strict';

  angular
    .module('missionhub.api.utils', [
      'LocalStorageModule',
      'change-case'
    ]);

})();

/* global window:false */
(function() {
  'use strict';

  angular
    .module('missionhub.api.utils')
    .constant('_', window._);

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
    .factory('lokiDB', lokiDBService);

  /** @ngInject */
  function lokiDBService(Loki, rx) {
    var factory = {
      get: get,
      search: search,
      save: save,
      apiImportItem: apiImportItem
    };

    var db;
    var dbLoaded = false;
    var dbLoadingObservable;

    var collections = [];

    activate();

    return factory;

    function activate(){
      var iDBAdapter = new LokiIndexedAdapter('missionhub-loki');
      db = new Loki('missionhub',
        {
          autosave: true,
          autosaveInterval: 1000, // 1 second
          adapter: iDBAdapter
        }
      );
      getDB();
    }

    function getDB(){
      if(dbLoaded) {
        return rx.Observable.just(db);
      }if(dbLoadingObservable) {
        return dbLoadingObservable;
      }else{
        return dbLoadingObservable = rx.Observable.create(function(observer){
          db.loadDatabase({}, function (){
            dbLoaded = true;
            observer.onNext(db);
            observer.onCompleted();
          });
        });
      }
    }


    function collection(name) {
      if (collections[name]) {
        return rx.Observable.just(collections[name]);
      } else {
        return getDB()
          .map(function () {
            var collection = db.getCollection(name);
            if (collection === null) {
              collection = db.addCollection(name, {disableChangesApi: false});
              collection.ensureUniqueIndex('id');
            }
            collections[name] = collection;
            return collection;
          });
      }
    }

    // Get object wrapped in observable
    function get(type, id){
      return collection(type)
        .map(function(collection){
          return collection.by('id', id);
        });
    }

    // Get all objects wrapped in observable
    function search(type, query, order){
      return collection(type)
        .map(function(collection){
          var chain = collection.chain();
          if(query) {
            chain = chain.find(query);
          }
          if(order) {
            chain = chain.simplesort(order.property, order.descending);
          }
          return chain.data();
        });
    }

    function save(type, object){
      return insertOrUpdate(type, object);
    }

    function apiImportItem(type, object){
      return insertOrUpdate(type, object, {disableChanges: true});
    }

    // Insert or update object depending in if it already exists. Return object wrapped in observable
    function insertOrUpdate(type, object, options){
      options = _.defaults(options || {}, {disableChanges: false});
      return collection(type)
        .map(function(collection){
          var existing = collection.by('id', object.id);
          var updatedObj;
          if(options.disableChanges){
            collection.setChangesApi( false );
          }
          if(existing){
            existing = _.merge(existing, object);
            updatedObj = collection.update(existing);
          }else{
            updatedObj = collection.insert(object);
          }
          collection.setChangesApi( true );
          return updatedObj;
        });
    }
  }
  lokiDBService.$inject = ["Loki", "rx"];

})();

(function() {
  'use strict';

  angular
    .module('missionhub.api.utils')
    .factory('jsonapi', jsonapiService);

  /** @ngInject */
  function jsonapiService(_, $log, changeCase) {
    var factory = {
      deserialize: deserialize,
      serialize: serialize,

      _indexIncludes: indexIncludes,
      _flattenData: flattenData,
      _findRelationships: findRelationships,
      _snakeToCamelCase: snakeToCamelCase,
      _camelToSnakeCase: camelToSnakeCase
    };

    var currentUrl;

    return factory;

    function deserialize(json, url) {
      currentUrl = url;
      var includesMap = indexIncludes(json.included);
      if (_.isArray(json.data)) {
        // Handle array of objects
        return _(json.data)
          .map(function (obj) {
            return flattenData(obj, includesMap);
          })
          .value();
      } else {
        // Handle single object
        return flattenData(json.data, includesMap);
      }
    }

    function serialize(data) {
      var serializedData = {
        id: data.id,
        type: data.typeJsonapi
      };
      serializedData.attributes = _(data)
        .pick(data.responseAttributes)
        .mapKeys(function(value, key){
          return camelToSnakeCase(key);
        })
        .value();
      return {data: serializedData};
    }

    function indexIncludes(includes) {
      return _(includes)
      // Index by type
        .groupBy(function (include) {
          return include.type;
        })
        // Foreach type group
        .mapValues(function (typeIncludes) {
          return _(typeIncludes)
          // index by id
            .mapKeys(function (typeInclude) {
              return typeInclude.id;
            })
            // Flatten include object
            .mapValues(flattenData)
            .value();
        })
        .value();
    }

    function flattenData(obj, includesMap) {
      var flattenedObj = {};
      flattenedObj.id = obj.id;
      flattenedObj.typeJsonapi = snakeToCamelCase(obj.type);
      // Convert attribute keys to camel case
      var attributes = _.mapKeys(obj.attributes, function(value, key){
        return snakeToCamelCase(key);
      });
      // Move attributes to root level
      flattenedObj = _.merge(flattenedObj, attributes);
      // Save list of keys that will be injected into root
      Object.defineProperty(flattenedObj, 'responseAttributes', {
        value: _.keys(attributes)
      });
      if (_.isObject(includesMap) && !_.isEmpty(includesMap)) {
        // Convert relationship keys to camel case
        var relationshipKeys = _.mapKeys(obj.relationships, function(value, key){
          return snakeToCamelCase(key);
        });
        // Compute relationships
        var relationships = findRelationships(relationshipKeys, includesMap);
        // Save list of keys that will be injected into root
        Object.defineProperty(flattenedObj, 'responseRelationships', {
          value: _.keys(relationships)
        });
        // Load relationships into root level
        flattenedObj = _.merge(flattenedObj, relationships);
      }
      return flattenedObj;
    }

    function findRelationships(relationships, includesMap) {
      return _(relationships)
      // Change value of each relationshipType to be the corresponding included objects
        .mapValues(function (relationshipType) {
          return _(relationshipType.data)
          // Change each relationship in the array to the corresponding flattened includes obj
            .map(function (relationship) {
              if (includesMap[relationship.type] === undefined || includesMap[relationship.type][relationship.id] === undefined) {
                $log.error('Deserializing response from', currentUrl + ': Could not load data for relationship of type', relationship.type, 'and id', relationship.id);
                return undefined;
              } else {
                return includesMap[relationship.type][relationship.id];
              }
            })
            .value();
        })
        .value();
    }

    function snakeToCamelCase(data){
      return changeCase.camelCase(data);
    }

    function camelToSnakeCase(data){
      return changeCase.snakeCase(data).replace(/(_)(\d)/g, '$2');
    }
  }
  jsonapiService.$inject = ["_", "$log", "changeCase"];

})();

(function() {
  'use strict';

  angular
    .module('missionhub.api.utils')
    .factory('datastore', datastoreService);

  function datastoreService(_, lokiDB, rx, organizations) {
    var factory = {
      get: get,
      search: search,
      save: save
    };

    rx.Observable.prototype.bind = function($scope, path, type){
      var currentObserver;
      return this.safeApply($scope,
        function(data){
          if(currentObserver){
            currentObserver.dispose();
          }
          _.set($scope, path, data);
          if(data) {
            currentObserver = rx.Observable.ofObjectChanges(_.get($scope, path))
              .filter(function (data) {
                return !_.includes(
                  ['getRestangularUrl', 'getRequestedUrl', 'addRestangularMethod', 'clone', 'withHttpConfig', 'plain', 'one', 'all', 'several', 'oneUrl', 'allUrl', 'get', 'getList', 'put', 'post', 'remove', 'head', 'trace', 'options', 'patch', 'save', 'customOperation', 'doPUT', 'customPUT', 'doPOST', 'customPOST', 'doGET', 'customGET', 'doDELETE', 'customDELETE', 'customGETLIST', 'doGETLIST'],
                  data.name
                );
              })
              .subscribe(function (change) {
                save(type, change.object)
                  .subscribe(function () {
                    console.log('saved', change)
                  });
              });
          }
        });
    };

    return factory;

    // Emit value retrieved from cache and then request, cache, and emit value from API
    function get(type, id){
      var apiResult = rx.Observable
        .fromPromise(organizations.currentRestangular().one(type, id).get())
        .flatMap(function(data){
          return lokiDB.apiImportItem(type, data);
        });
      var delay = 0;
      console.log('delaying api by', delay, 'seconds');
      return lokiDB.get(type, id).concat(apiResult.delay(delay));
    }

    // Emit values retrieved from cache and then request, save, and emit value from API
    function search(type, query, order){
      var apiResult = rx.Observable
        .fromPromise(organizations.currentRestangular().all(type).getList())
        .flatMap(function(data){
          return data;
        })
        // cache each item
        .flatMap(function(data){
          return lokiDB.apiImportItem(type, data);
        })
        .toArray();

      return lokiDB.search(type, query, order)
        .concat(apiResult.flatMap(function() {
          return lokiDB.search(type, query, order);
        }));
    }

    function save(type, object){
      return lokiDB.save(type, object);
    }
  }
  datastoreService.$inject = ["_", "lokiDB", "rx", "organizations"];

})();

(function() {
  'use strict';

  angular
    .module('missionhub.api', [
      'restangular',
      'lokijs',
      'rx',

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

  function peopleService(organizations, userDetails, datastore) {
    var factory = {
      all: getAll,
      get: get,
      save: save
      /*getWithEmails: getWithEmails,
      getWithInteractions: getWithInteractions,
      current: getCurrent*/
    };
    return factory;

    function getAll(query, order){
      return datastore.search('people', query, order);
      //return organizations.currentRestangular().all('people').getList(queryParams);
    }

    function get(id){
      //console.log('disabledApi');
      return datastore.get('people', id)//.first();
    }

    function save(obj){
      return datastore.save('people', obj);
    }

    function getCurrent(){
      return organizations.currentRestangular().one('people', userDetails.getPersonId()).get();
    }

    function getWithEmails(id){
      return organizations.currentRestangular().one('people', id).get({include: 'email_addresses'});
    }

    function getWithInteractions(id){
      return organizations.currentRestangular().one('people', id).get({include: 'interactions'});
    }
  }
  peopleService.$inject = ["organizations", "userDetails", "datastore"];

})();

(function() {
  'use strict';

  angular
    .module('missionhub.api')
    .factory('organizations', organizationsService);

  function organizationsService(Restangular, userDetails) {

    var factory = {
      all: getAll,
      current: getCurrent,
      allRestangular: allRestangular,
      currentRestangular: currentRestangular
    };
    return factory;

    function getAll(){
      return factory.allRestangular().getList();
    }

    function getCurrent(){
      return factory.currentRestangular().get();
    }

    function allRestangular(){
      return Restangular.all('organizations');
    }

    function currentRestangular(){
      return Restangular.one('organizations', userDetails.getCurrentOrganization().id);
    }
  }
  organizationsService.$inject = ["Restangular", "userDetails"];

})();

(function() {
  'use strict';

  angular
    .module('missionhub.api')
    .factory('filters', filtersService);

  function filtersService(Restangular, $q, _, people) {

    var factory = {
      assignedTo: loadPeople,
      initiators: loadPeople,
      interactions: interactions,
      groups: groups,
      status: status,
      permissions: permissions,
      gender: gender,
      faculty: faculty,
      surveys: surveys,
      questions: questions,
      answers: answers
    };
    return factory;

    function loadPeople(){
      //TODO: retrieve all, not just first page
      return people.all().then(function(people){
        return _.map(people, function(person){
          return { name: person.full_name };
        });
      });
    }

    function interactions(){
      return $q(function(resolve) {
        resolve([
          {
            name: 'To retrieve from server'
          }
        ]);
      });
    }

    function groups(){
      return $q(function(resolve) {
        resolve([
          {
            name: 'To retrieve from server'
          }
        ]);
      });
    }

    function status(){
      return $q(function(resolve) {
        resolve([
          {
            id: 'uncontacted',
            name: 'Uncontacted'
          },
          {
            id: 'attempted_contact',
            name: 'Attempted Contact'
          },
          {
            id: 'contacted',
            name: 'Contacted'
          },
          {
            id: 'completed',
            name: 'Completed'
          },
          {
            id: 'do_not_contact',
            name: 'Do Not Contact'
          }
        ]);
      });
    }

    function permissions(){
      return $q(function(resolve) {
        resolve([
          {
            id: 'admin',
            name: 'Admin'
          },
          {
            id: 'user',
            name: 'User'
          },
          {
            id: 'guest',
            name: 'Guest'
          },
          {
            id: 'none',
            name: 'None'
          }
        ]);
      });
    }

    function gender(){
      return $q(function(resolve) {
        resolve([
          {
            id: 'male',
            name: 'Male'
          },
          {
            id: 'female',
            name: 'Female'
          }
        ]);
      });
    }

    function faculty(){
      return $q(function(resolve) {
        resolve([
          {
            id: 'yes',
            name: 'Yes'
          },
          {
            id: 'no',
            name: 'No'
          }
        ]);
      });
    }

    function surveys(){
      return $q(function(resolve) {
        resolve([
          {
            name: 'Survey 1'
          },
          {
            name: 'Survey 2'
          }
        ]);
      });
    }

    function questions(survey){
      return $q(function(resolve) {
        resolve([
          {
            name: 'Question 1 - ' + survey
          },
          {
            name: 'Question 1 - ' + survey
          }
        ]);
      });
    }

    function answers(survey, question){
      return $q(function(resolve) {
        resolve([
          {
            name: 'Answer 1 - ' + survey + ' - ' + question
          },
          {
            name: 'Answer 1 - ' + survey + ' - ' + question
          }
        ]);
      });
    }
  }
  filtersService.$inject = ["Restangular", "$q", "_", "people"];

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

    apiService.$inject = ["Restangular", "jsonapi", "people", "organizations", "filters"];
    return providerFactory;

    /** @ngInject */
    function apiService(Restangular, jsonapi, people, organizations, filters) {
      var factory = {
        baseUrl: providerFactory.baseUrl, //TODO: remove if not needed

        people: {
          all: people.all,
          current: people.current,
          get: people.get,
          save: people.save/*,
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
        },
        filters: {
          possibilities: {
            assignedTo: filters.assignedTo,
            initiators: filters.initiators,
            interactions: filters.interactions,
            groups: filters.groups,
            status: filters.status,
            permissions: filters.permissions,
            gender: filters.gender,
            faculty: filters.faculty,
            surveys: filters.surveys,
            questions: filters.questions,
            answers: filters.answers
          }
        }
      };

      activate();

      function activate(){
        Restangular.addResponseInterceptor(function(data, operation, what, url) {
          return jsonapi.deserialize(data, url);
        });
        Restangular.addRequestInterceptor(function(data, operation) {
          if(operation === 'PATCH'){
            return jsonapi.serialize(data);
          }else{
            return data;
          }
        });
      }

      return factory;
    }
  }
  apiProvider.$inject = ["apiConfig", "RestangularProvider"];

})();

/* global window:false */
(function() {
  'use strict';

  angular
    .module('missionhub.api')
    .constant('_', window._)
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
