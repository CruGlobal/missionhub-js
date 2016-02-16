(function() {
  'use strict';

  angular
    .module('missionhub.api.utils')
    .factory('datastore', datastoreService);

  function datastoreService($log, _, lokiDB, rx, organizations, observeOnScope, deepDiff) {
    var factory = {
      get: get,
      search: search,
      save: save
    };

    rx.Observable.prototype.bind = function($scope, path, type){
      var currentObjectState;
      var skipNextChangeDetection = false;

      //Initialize with empty object so there is never a change where the lhs is nonexistent
      _.set($scope, path, {});

      var changesStream = observeOnScope($scope, path, true)
        // Filter out this change if the scope was just updated by an API response
        .filter(function(){
          if(skipNextChangeDetection){
            skipNextChangeDetection = false;
            return false;
          }else{
            return true;
          }
        })
        .map(function(watch){
          //Save whole object to be referenced later
          currentObjectState = watch.newValue;

          //Return the diff between the $watch's oldValue and newValue
          return deepDiff.diff(watch.oldValue, watch.newValue, function preFilter(path, key){
            //ignore properties prefixed with $ and fields added by 3rd party libraries
            return key[0] === '$' ||
              _.includes(
                //TODO: remove interactions and messages
                ['getRestangularUrl', 'getRequestedUrl', 'addRestangularMethod', 'clone', 'withHttpConfig', 'plain', 'one', 'all', 'several', 'oneUrl', 'allUrl', 'get', 'getList', 'put', 'post', 'remove', 'head', 'trace', 'options', 'patch', 'save', 'customOperation', 'doPUT', 'customPUT', 'doPOST', 'customPOST', 'doGET', 'customGET', 'doDELETE', 'customDELETE', 'customGETLIST', 'doGETLIST', 'meta', 'interactions', 'messages'],
                key
              );
          });
        })
        //Filter out cases where diffs is undefined
        .filter(function(diffs){
          return diffs !== undefined;
        })
        //Transform array of diffs into many emissions
        .flatMap(function(diffs){
          return rx.Observable.from(diffs);
        });
      var changesetStream = changesStream
        //Wait until stream has been quiet for 500ms and then emit everything since the last window emitted
        .window(changesStream.debounce(500))
        //Reduce window of diffs into a single changeset object
        .flatMap(function (changesGroup) {
          return changesGroup
            .reduce(function(acc, change){
              var isRelated = change.path.length > 1 && _.has(_.get(currentObjectState, _.dropRight(change.path)), 'typeJsonapi');
              switch(change.kind){
                case 'N': //New
                case 'E': //Edit
                  if(!isRelated) {
                    _.set(acc, change.path, change.rhs);
                  }else{
                    console.log('construct changed obj to send to', change.path[0] + '/' + _.get(currentObjectState, _.dropRight(change.path)).id);
                  }
                  break;
                case 'D': //Delete
                  if(!isRelated) {
                    //TODO: see if setting attribute to null is a good persistence strategy for the API
                    _.set(acc, change.path, null);
                  }else{
                    console.log('send DELETE to', change.path[0] + '/' + change.rhs.id);
                  }
                  break;
                default: //TODO: need to add type 'A' (Array Change)
                  $log.error('Change type not handled', change);
                  break;
              }
              return acc;
            }, {})
            .filter(function(changeset){
              return !_.isEmpty(changeset);
            })
            .flatMap(function(changeset){
              //Add id and type to changeset object
              _.merge(changeset, {id: currentObjectState.id, typeJsonapi: currentObjectState.typeJsonapi});
              //Send this changeset to API using PATCH
              return save(type, changeset);
            });
        });

      //Merge in results from saving changesets and apply updates from API to scope
      return this.merge(changesetStream)
        .safeApply($scope, function(data) {
          console.log('%cApplying data to scope', 'color: purple', data);
          //Skip change detection when loading updates from API
          skipNextChangeDetection = true;
          //apply external data updates to scope
          _.set($scope, path, data);
        });
    };

    return factory;

    // Emit value retrieved from cache and then request, cache, and emit value from API
    function get(type, id){
      var apiResult = rx.Observable
        .fromPromise(organizations.currentRestangular().one(type, id).get())
        .flatMap(function(data){
          return lokiDB.save(type, data);
        });
      return lokiDB.get(type, id).concat(apiResult);
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
          return lokiDB.save(type, data);
        })
        .toArray();

      return lokiDB.search(type, query, order)
        .concat(apiResult.flatMap(function() {
          return lokiDB.search(type, query, order);
        }));
    }

    function save(type, object){
      return rx.Observable
        .fromPromise(organizations.currentRestangular().one(type, object.id).patch(object))
        .flatMap(function(data){
          console.log('%cresponse from save', 'color: green; font-weight: bold', data);
          return cache(type, data);
        });
    }

    function cache(type, object){
      return lokiDB.save(type, object);
    }
  }

})();
