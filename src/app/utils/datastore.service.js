(function() {
  'use strict';

  angular
    .module('missionhub.api.utils')
    .factory('datastore', datastoreService);

  function datastoreService(apiConfig, $log, _, pathUtils, lokiDB, rx, Restangular, observeOnScope, deepDiff) {
    var basePath = apiConfig.baseUrl;

    var factory = {
      get: get,
      getFromApiOnly: getFromApiOnly,
      search: search,
      save: save,
      saveAll: saveAll,
      parent: parent,
      getParentPath: getParentPath,
      bind: bind,
      currentRestangular: currentRestangular,
      _findParentResourceOfChange: findParentResourceOfChange
    };

    return factory;

    function parent(path){
      // Create new factory object that combines last parentPath and new parentPath
      return _.create(this, {parentPath: pathUtils.concat([this.parentPath, pathUtils.parse(path)])});
    }

    function currentRestangular(){
      return Restangular.oneUrl('parentPath', this.getParentPath());
    }

    function getParentPath(){
      return pathUtils.concat([basePath, this.parentPath]);
    }

    function findParentResourceOfChange(object, path){
      var foundObj;
      var changesPath = path;
      var resourcePath = [];
      _.forEachRight(path, function(pathItem, index){
        var currentPath = _.slice(path, 0, index + 1);
        var currentObj = _.get(object, currentPath);
        if(currentObj && currentObj.id !== undefined && currentObj.typeJsonapi !== undefined){
          if(!foundObj){
            foundObj = currentObj;
            changesPath = _.slice(path, index + 1);
          }
          resourcePath.unshift(currentObj.id);
          resourcePath.unshift(currentObj.typeJsonapi);
        }
      });
      if(!foundObj) {
        foundObj = object;
      }
      if(object.id === undefined || object.typeJsonapi === undefined){
        throw new Error('No object containing an id and typeJsonapi was found');
      }
      resourcePath.unshift(object.id);
      resourcePath.unshift(object.typeJsonapi);
      return {object: foundObj, changesPath: changesPath, resourcePath: resourcePath};
    }

    function bind($scope, path, type){
      var that = this;
      var currentObjectState;
      var initialLoadFromCache = false;

      //Initialize with empty object so there is never a change where the lhs is nonexistent
      _.set($scope, path, {});

      var changesStream = observeOnScope($scope, path, true)
      // Filter out this change if the scope was just updated by an API response
        .filter(function(watch){
          if(watch.oldValue === watch.newValue){
            return false;
          }
          if(watch.newValue.skipNextChangeDetection){
            _.unset($scope, path + '.skipNextChangeDetection');
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
                ['meta', 'interactions', 'messages', 'skipNextChangeDetection'],
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
        })
        .publish();
      var changesetStream = changesStream
      //Wait until stream has been quiet for 500ms and then emit everything since the last window emitted
        .window(changesStream.debounce(500))
        //Reduce window of diffs into a single changeset object
        .flatMap(function (changesGroup) {
          return changesGroup
            .reduce(function(acc, change){
              switch(change.kind){
                case 'N': //New
                case 'E': //Edit
                  var objectChanges = findParentResourceOfChange(currentObjectState, change.path);
                  var resourcePath = _.join(objectChanges.resourcePath, '/');
                  //Add id and type to initial changeset object
                  acc[resourcePath] = acc[resourcePath] || {id: objectChanges.object.id, typeJsonapi: objectChanges.object.typeJsonapi};
                  _.set(acc[resourcePath], objectChanges.changesPath, change.rhs);
                  break;
                case 'D': //Delete
                  $log.error('Change type not handled', change);
                  /*if(!isRelated) {
                   //TODO: see if setting attribute to null is a good persistence strategy for the API
                   _.set(acc, change.path, null);
                   }else{
                   console.log('send DELETE to', change.path[0] + '/' + change.rhs.id);
                   }*/
                  break;
                default: //TODO: need to add type 'A' (Array Change)
                  $log.error('Change type not handled', change);
                  break;
              }
              return acc;
            }, {})
            .filter(function(changesets){
              return !_.isEmpty(changesets);
            })
            .flatMap(function(changesets){
              //Send these changesets to API using PATCH
              return that.saveAll(changesets, currentObjectState.typeJsonapi, currentObjectState.id).observable;
            });
        });
      changesStream.connect(); //Connect to hot observable so both the changesetStream and it's window us the same observable

      //Merge in results from saving changesets and apply updates from API to scope
      return _.create(this, {
        observable: this.observable.merge(changesetStream)
          .safeApply($scope, function (data) {
            if (!initialLoadFromCache) {
              console.log('%cInitializing cache to scope', 'color: purple', data);
              data.skipNextChangeDetection = true;
              _.set($scope, path, data);
              initialLoadFromCache = true;
            }
          })
      });
    }

    // Emit value retrieved from cache and then request, cache, and emit value from API
    function get(type, id){
      return _.create(this, {observable: lokiDB.get(type, id).concat(this.getFromApiOnly(type, id).observable)});
    }

    function getFromApiOnly(type, id){
      return _.create(this, {
        observable: rx.Observable
          .fromPromise(this.currentRestangular().one(type, id).get())
          .flatMap(function (data) {
            return cache(data);
          })
      });
    }

    // Emit values retrieved from cache and then request, save, and emit value from API
    function search(type, query, order){
      var apiResult = rx.Observable
        .fromPromise(this.currentRestangular().all(type).getList())
        // cache each item
        .flatMap(function(data){
          return cache(data);
        })
        .toArray();

      return _.create(this, {
        observable: lokiDB.search(type, query, order)
          .concat(apiResult.flatMap(function() {
            return lokiDB.search(type, query, order);
          }))
      });
    }

    function saveAll(changesets, type, id){
      var that = this;
      //TODO: handle combining and returning when all done in Rx.js
      return _.create(this, {
        observable: rx.Observable.pairs(changesets)
          .flatMap(function(changeset){
            return that.save(changeset[0], changeset[1]).observable;
          })
          .count(function() { return true; })
          .flatMap(function(count) {
            console.log('%cSAVED', 'color: green; font-weight: bold', count, 'resources');
            return that.getFromApiOnly(type, id).observable;
          })
      });
    }

    function save(path, object){
      var that = this;
      return _.create(this, {
        observable: rx.Observable
          .fromPromise(Restangular.oneUrl('resourcePath', pathUtils.concat([that.getParentPath(), path])).patch(object))
          .flatMap(function (data) {
            console.log('%cSaving', 'color: green; font-weight: bold', path, object, 'Response', data);
            //TODO: Think about effects of caching objects that aren't used separately. They may only be accessed in a nested object.
            return cache(data);
          })
      });
    }

    function cache(object){
      object = object.plain();
      object.skipNextChangeDetection = true;
      return lokiDB.save(object.typeJsonapi, object);
    }
  }

})();
