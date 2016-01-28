(function() {
  'use strict';

  angular
    .module('missionhub.api.utils')
    .factory('jsonapi', jsonapiService);

  /** @ngInject */
  function jsonapiService(_, $log, changeCase) {
    var factory = {
      deserialize: deserialize,
      serialize: serialize,

      _indexIncludes: indexIncludes,
      _flattenData: flattenData,
      _findRelationships: findRelationships,
      _snakeToCamelCase: snakeToCamelCase,
      _camelToSnakeCase: camelToSnakeCase
    };

    var currentUrl;

    return factory;

    function deserialize(json, url) {
      currentUrl = url;
      var includesMap = indexIncludes(json.included);
      if (_.isArray(json.data)) {
        // Handle array of objects
        return _(json.data)
          .map(function (obj) {
            return flattenData(obj, includesMap);
          })
          .value();
      } else {
        // Handle single object
        return flattenData(json.data, includesMap);
      }
    }

    function serialize(data) {
      var serializedData = {
        id: data.id,
        type: data.typeJsonapi
      };
      serializedData.attributes = _(data)
        .pick(data.responseAttributes)
        .mapKeys(function(value, key){
          return camelToSnakeCase(key);
        })
        .value();
      return {data: serializedData};
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
      flattenedObj.typeJsonapi = snakeToCamelCase(obj.type);
      // Convert attribute keys to camel case
      var attributes = _.mapKeys(obj.attributes, function(value, key){
        return snakeToCamelCase(key);
      });
      // Move attributes to root level
      flattenedObj = _.merge(flattenedObj, attributes);
      // Save list of keys that will be injected into root
      Object.defineProperty(flattenedObj, 'responseAttributes', {
        value: _.keys(attributes)
      });
      if (_.isObject(includesMap) && !_.isEmpty(includesMap)) {
        // Convert relationship keys to camel case
        var relationshipKeys = _.mapKeys(obj.relationships, function(value, key){
          return snakeToCamelCase(key);
        });
        // Compute relationships
        var relationships = findRelationships(relationshipKeys, includesMap);
        // Save list of keys that will be injected into root
        Object.defineProperty(flattenedObj, 'responseRelationships', {
          value: _.keys(relationships)
        });
        // Load relationships into root level
        flattenedObj = _.merge(flattenedObj, relationships);
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
              if (includesMap[relationship.type] === undefined || includesMap[relationship.type][relationship.id] === undefined) {
                $log.error('Deserializing response from', currentUrl + ': Could not load data for relationship of type', relationship.type, 'and id', relationship.id);
                return undefined;
              } else {
                return includesMap[relationship.type][relationship.id];
              }
            })
            .value();
        })
        .value();
    }

    function snakeToCamelCase(data){
      return changeCase.camelCase(data);
    }

    function camelToSnakeCase(data){
      return changeCase.snakeCase(data).replace(/(_)(\d)/g, '$2');
    }
  }

})();
