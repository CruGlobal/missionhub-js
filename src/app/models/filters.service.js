(function() {
  'use strict';

  angular
    .module('missionhub.api')
    .factory('filters', filtersService);

  function filtersService(Restangular, $q, _, people) {

    var factory = {
      assignedTo: assignedTo,
      interactions: interactions,
      groups: groups,
      status: status,
      permissions: permissions,
      gender: gender,
      faculty: faculty,
      surveys: surveys
    };
    return factory;

    function assignedTo(){
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
            name: 'To retrieve from server'
          }
        ]);
      });
    }
  }

})();
