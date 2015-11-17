(function() {
  'use strict';

  angular
    .module('missionhub.api.utils')
    .factory('jsonapi', jsonapiService);

  /** @ngInject */
  function jsonapiService(_, $log) {
    var factory = {
      deserialize: deserialize,

      _indexIncludes: indexIncludes,
      _flattenData: flattenData,
      _findRelationships: findRelationships
    };
    var currentUrl;
    return factory;

    function deserialize(json, url) {
      currentUrl = url;
      var includesMap = indexIncludes(json.included);
      if(_.isArray(json.data)){
        // Handle array of objects
        return _(json.data)
          .map(function (obj) {
            return flattenData(obj, includesMap);
          })
          .value();
      }else{
        // Handle single object
        return flattenData(json.data, includesMap);
      }
    }

    function indexIncludes(includes) {
      return _(includes)
      // Index by type
        .groupBy(function (include) {
          return include.type;
        })
        // Foreach type group
        .mapValues(function (typeIncludes) {
          return _(typeIncludes)
          // index by id
            .mapKeys(function (typeInclude) {
              return typeInclude.id;
            })
            // Flatten include object
            .mapValues(flattenData)
            .value();
        })
        .value();
    }

    function flattenData(obj, includesMap) {
      var flattenedObj = {};
      flattenedObj.id = obj.id;
      flattenedObj.type = obj.type;
      //Move attributes to root level
      flattenedObj = _.merge(flattenedObj, obj.attributes);
      if (_.isObject(includesMap) && !_.isEmpty(includesMap)) {
        // Load relationships into root level
        flattenedObj = _.merge(flattenedObj, findRelationships(obj.relationships, includesMap));
      }
      return flattenedObj;
    }

    function findRelationships(relationships, includesMap) {
      return _(relationships)
      // Change value of each relationshipType to be the corresponding included objects
        .mapValues(function (relationshipType) {
          return _(relationshipType.data)
          // Change each relationship in the array to the corresponding flattened includes obj
            .map(function (relationship) {
              if(includesMap[relationship.type] === undefined || includesMap[relationship.type][relationship.id] === undefined) {
                $log.error('Deserializing response from', currentUrl + ': Could not load data for relationship of type', relationship.type, 'and id', relationship.id);
                return undefined;
              }else{
                return includesMap[relationship.type][relationship.id];
              }
            })
            .value();
        })
        .value();
    }
  }
})();
