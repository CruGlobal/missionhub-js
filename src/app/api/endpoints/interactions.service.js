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

})();
