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

})();
