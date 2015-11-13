(function() {
  'use strict';

  angular
    .module('missionhub.api.utils')
    .provider('jsonapi', jsonapiProvider);

  /** @ngInject */
  function jsonapiProvider(_) {
    var providerFactory = {
      $get: jsonapiService,
      deserialize: deserialize
    };

    return providerFactory;

    /** @ngInject */
    function jsonapiService() {
      var factory = {
        deserialize: deserialize,

        _indexIncludes: indexIncludes,
        _flattenData: flattenData,
        _findRelationships: findRelationships
      };
      return factory;
    }

    function deserialize(json) {
      var includesMap = indexIncludes(json.included);
      if(_.isArray(json.data)){
        return _(json.data)
          .map(function (obj) {
            return flattenData(obj, includesMap);
          })
          .value();
      }else{
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
      // Change value of each relationshipType
        .mapValues(function (relationshipType) {
          return _(relationshipType.data)
          // Change each relationship in the array to the corresponding flattened includes obj
            .map(function (relationship) {
              return includesMap[relationship.type][relationship.id];
            })
            .value();
        })
        .value();
    }
  }
})();
