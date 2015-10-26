
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
})();
