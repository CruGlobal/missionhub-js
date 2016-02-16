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
      return datastore.get('people', id);
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

})();
