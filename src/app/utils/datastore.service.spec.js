(function () {
  'use strict';

  describe('service datastore', function () {
    var self = {};
    beforeEach(module('missionhub.api.utils'));

    beforeEach(function(){
      inject(function(datastore) {
        self.datastore = datastore;
      });
    });

    it('should be registered', function () {
      expect(self.datastore).toBeDefined();
    });

    describe('findParentResourceOfChange function', function(){
      it('should throw an error if there is no typeJson property', function(){
        var noTypeJsonapi = {
          id: 1,
          firstName: 'Joe',
          lastName: 'Smith'
        };
        expect(function(){ self.datastore._findParentResourceOfChange(noTypeJsonapi, ['lastName']) })
          .toThrow(new Error('No object containing an id and typeJsonapi was found'));

        var noId = {
          typeJsonapi: 1,
          firstName: 'Joe',
          lastName: 'Smith'
        };
        expect(function(){ self.datastore._findParentResourceOfChange(noId, ['lastName']) })
          .toThrow(new Error('No object containing an id and typeJsonapi was found'));
      });
      it('should handle a basic object with no nested relationships', function(){
        var object = {
          id: 1,
          typeJsonapi: 'people',
          firstName: 'Joe',
          lastName: 'Smith'
        };
        expect(self.datastore._findParentResourceOfChange(object, ['lastName']))
          .toEqual({
            object: object,
            changesPath: ['lastName'],
            resourcePath: ['people', 1]
          });
      });
      it('should handle a change on the base object with nested relationships', function(){
        var object = {
          id: 1,
          typeJsonapi: 'people',
          firstName: 'Joe',
          lastName: 'Smith',
          addresses: [
            {
              id: 2,
              typeJsonapi: 'addresses',
              city: 'San Francisco'
            }
          ]
        };
        expect(self.datastore._findParentResourceOfChange(object, ['lastName']))
          .toEqual({
            object: object,
            changesPath: ['lastName'],
            resourcePath: ['people', 1]
          });
      });
      it('should handle a change on a nested object 1 deep and find the deepest object with typeJson (deepest resource)', function(){
        var object = {
          id: 1,
          typeJsonapi: 'people',
          addresses: [
            {
              id: 2,
              typeJsonapi: 'addresses',
              city: 'San Francisco'
            }
          ]
        };
        expect(self.datastore._findParentResourceOfChange(object, ['addresses', 0, 'city']))
          .toEqual({
            object: {
              id: 2,
              typeJsonapi: 'addresses',
              city: 'San Francisco'
            },
            changesPath: ['city'],
            resourcePath: ['people', 1, 'addresses', 2]
          });
      });
      it('should handle a change on a nested object 2 deep and find the deepest object with typeJson (deepest resource)', function(){
        var object = {
          id: 1,
          typeJsonapi: 'people',
          addresses: [
            {
              id: 2,
              typeJsonapi: 'addresses',
              city: 'San Francisco',
              deeperObject: {
                id: 3,
                typeJsonapi: 'deeperObject',
                name: 'something'
              }
            }
          ]
        };
        expect(self.datastore._findParentResourceOfChange(object, ['addresses', 0, 'deeperObject', 'name']))
          .toEqual({
            object: {
              id: 3,
              typeJsonapi: 'deeperObject',
              name: 'something'
            },
            changesPath: ['name'],
            resourcePath: ['people', 1, 'addresses', 2, 'deeperObject', 3]
          });
      });
    });
  });
})();

