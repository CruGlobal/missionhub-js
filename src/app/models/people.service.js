(function() {
  'use strict';

  angular
    .module('missionhub.api')
    .factory('people', peopleService);

  function peopleService(organizations, userDetails) {
    var factory = {
      all: getAll,
      get: get,
      getWithEmails: getWithEmails,
      getWithInteractions: getWithInteractions,
      current: getCurrent
    };
    return factory;

    function getAll(order, limit, offset){
      var queryParams = {
        order: order,
        limit: limit,
        offset: offset
      };
      return organizations.currentRestangular().all('people').getList(queryParams);
    }

    function get(id){
      return organizations.currentRestangular().one('people', id).get();
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

})();
