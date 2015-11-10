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

})();
