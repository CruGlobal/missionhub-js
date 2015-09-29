angular.module('missionhub')
  .constant('config', {baseUrl: 'https://stage.missionhub.com/apis/v3/'})
  
  .factory('api', function($rootScope, $resource, $q, loginDetails, config, personCache, organizationCache, organizationListCache) {
    // put const here
    var that = this;

    var mhResource = function (endpoint, options) {
      if(!loginDetails.token()) {
        var deferred = $q.defer();
        deferred.resolve({endpoint: []});
        return deferred.promise;
      } else {
        if (that.currentOrgId && endpoint !== 'organizations') {
          angular.extend(options, {'organization_id': that.currentOrgId});
        }
        return $resource(config.baseUrl + endpoint +'/:id', {id:'@id', facebook_token: facebook_token()}).get(options).$promise;
      }
    };

    function facebook_token() {
      return loginDetails.token();
    }

    function currentPerson() {
      return personCache.person(that.currentPersonId);
    }

    function currentOrg(org) {
      if(!org) {
        return organizationCache.organization(that.currentOrgId);
      }
      var includes = ['admins', 'users', 'surveys', 'labels', 'questions', 'interaction_types'];
      return getOrganizations({
        id: org.id,
        include: includes.join(),
        organization_id: org.id //please do not remove this line. The org request will break. This must be set so that the scope of the request is the organization with id = org.id. If you try to request an organization with a different id to organization_id it will return a 404. If organization_id is unset it will default to me.user.primary_organization_id which is fine for the first request but will prevent the user changing organizations
      })
      .then(function(data) {
        var org = data.organization;
        organizationCache.organization(org);
        if(that.currentOrgId != org.id) {
          that.currentOrgId = org.id;
          $rootScope.$broadcast('current-org-updated', org);
        }
      }, function(error) {
        alert('Organization change failed because: ' + error.statusText);
      });
    }

    //define methods
    function getMe() {
      var includes = ['all_organization_and_children', 'all_organizational_permissions', 'user', 'organizational_permission' ,'permission', 'organizational_labels', 'label', 'interactions', 'email_addresses', 'phone_numbers', 'addresses'];
      var mePromise = $q.defer();
      getPeople({id:'me', include: includes.join()})
      .then(function(data) {
        var me = data.person;
        that.currentPersonId = me.id;
        personCache.person(me);
        organizationListCache.list(me.all_organization_and_children);
        currentOrg({id: me.user.primary_organization_id}).then(function() {
          mePromise.resolve(me);
        }, function(error) {
          mePromise.reject(error);
        });
      }, function(error) {
        alert('Requesting your data failed due to: ' + error);
          mePromise.reject(error);
      });
      return mePromise.promise;
    }

    function getPeople(options) {
      var promise = mhResource('people', options);
      promise.then(function(data) {
        // save to cache now
        angular.forEach(data.people, function(person) {
          personCache.person(person);
        });
      });
      return promise;
    }

    function getInteractions(options) {
      return mhResource('interactions', options);
    }

    function getOrganizations(options) {
      return mhResource('organizations', options);
    }

    // return interface
    return {
      currentPerson: currentPerson,
      currentOrg: currentOrg,
      getMe: getMe,
      people: {
        get: getPeople
      },
      interactions: {
        get: getInteractions
      },
      organizations: {
        get: getOrganizations
      }
    }
  })

  .factory('loginDetails', function () {
    var tokenStorageKey = 'facebook_token';

    function token(value) {
      if(value !== undefined) {
        if(value) {
          localStorage.setItem(tokenStorageKey, value);
        }
        else {
          localStorage.removeItem(tokenStorageKey);
        }
      }
      else {
        return localStorage.getItem(tokenStorageKey);
      }
    }

    return {
      token: token
    };
  });

angular.module('missionhub')
  .factory('personCache', function() {
    // set up variables and constants
    var cachedPeople = {};

    // define methods

    // if you give person() a person object, it will cache it.
    // if you give it an id, it will return a person object if it has it.
    function person(newValue) {
      if (newValue.id) {
        cachedPeople[newValue.id] = cachedPeople[newValue.id] || {}
        angular.merge(cachedPeople[newValue.id], newValue);
        return true;
      }
      return cachedPeople[newValue];
    }

    // return interface
    return {
      person: person
    }
  })
  .factory('organizationCache', function() {
    // set up variables and constants
    var cachedOrganizations = {};

    // define methods

    // if you give person() a person object, it will cache it.
    // if you give it an id, it will return a person object if it has it.
    function organization(newValue) {
      if (newValue.id) {
        cachedOrganizations[newValue.id] = cachedOrganizations[newValue.id] || {}
        angular.merge(cachedOrganizations[newValue.id], newValue);
        return true;
      }
      return cachedOrganizations[newValue];
    }

    // return interface
    return {
      organization: organization
    }
  })
  .factory('organizationListCache', function() {
    var cachedOrganizationList = [];

    function list(newList) {
      if (newList && newList.length) {
        // don't override cache if list is empty
        if(newList.length == 0) {
          return cachedOrganizationList.length == 0;
        }
        cachedOrganizationList = [];
        angular.merge(cachedOrganizationList, newList);
        return true;
      }
      return angular.extend([], cachedOrganizationList);
    }

    return {
      list: list
    }
  });

angular.module('missionhub')
  .filter('interactionPrimaryInitiator', function() {
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
  });
angular.module('missionhub')
  .filter('personAvatar', function() {
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

      return "https://avatars.discourse.org/letter/" + person.first_name.slice(0,1) + "/" + colour +
        "/" + size + ".png";
    };
  })
  .filter('personPrimaryPhone', function() {
    return function (person) {

      if (!person || !person.phone_numbers || person.phone_numbers.length == 0) {
        return '';
      }
      var i = 0;
      while (i < person.phone_numbers.length) {
        if(person.phone_numbers[i].primary)
          return person.phone_numbers[i].number;
        i++;
      }
      return person.phone_numbers[0].number;
    };
  })
  .filter('personFullname', function(){
    return function(person) {
      if (!person || !person.first_name) {
        return '';
      }
      return person.first_name + ' ' + person.last_name;
    };
  });

angular.module('missionhub')
.filter('backgroundStyle', function(){
  return function(url) {
    return 'background-image: url(' + url + ')';
  }
})
.filter('tel', function () {
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

    if (country == 1) {
      country = "";
    }

    number = number.slice(0, 3) + '-' + number.slice(3);

    return (country + " (" + city + ") " + number).trim();
  };
})
  .filter('googleMapsAddress', function () {
    return function (address) {
      mailingAddress = 'http://maps.google.com/maps?q=';

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
      if (mailingAddress.lastIndexOf('+') == mailingAddress.length - 1) {
        mailingAddress = mailingAddress.slice(0, -1);
      }

      return mailingAddress;
    };
  });