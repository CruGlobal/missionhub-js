(function () {
  'use strict';

  describe('service jsonapi', function () {
    var self = {};
    beforeEach(module('missionhub.api.utils'));

    beforeEach(function(){
      inject(function(jsonapi) {
        self.jsonapi = jsonapi;
      });

      var person = {
        "id": "2829607",
        "type": "person",
        "attributes": {
          "first_name": "Fname",
          "last_name": "Lname",
          "gender": "Male",
          "campus": null,
          "year_in_school": "Senior",
          "major": null,
          "minor": null,
          "birth_date": "1990-01-01",
          "date_became_christian": null,
          "graduation_date": null,
          "picture": "",
          "user_id": 1234567,
          "fb_uid": 123456789,
          "created_at": "2015-10-20T15:03:39Z",
          "updated_at": "2015-10-26T23:56:05Z",
          "organizational_permission": 7
        },
        "relationships": {
          "email_addresses": {
            "data": [{
              "id": "487976",
              "type": "email_address"
            }]
          }, "interactions": {"data": []}
        }
      };
      var included = [{
        "id": "487976",
        "type": "email_address",
        "attributes": {
          "email": "myname@gmail.com",
          "person_id": 2829607,
          "primary": true,
          "created_at": "2015-10-20T15:00:05Z",
          "updated_at": "2015-10-20T15:03:41Z"
        }
      }];
      self.singleInput = {
        "data": person,
        "included": included
      };
      self.manyInputs = {
        "data": [person],
        "included": included
      };
    });

    it('should be registered', function () {
      expect(self.jsonapi).toBeDefined();
    });

    describe('deserialize function', function(){
      describe('when receiving a single resource', function(){
        it('should return a compacted object with relationships inline', function(){
          expect(self.jsonapi.deserialize(self.singleInput)).toEqual({
            id: '2829607',
            typeJsonapi: 'person',
            firstName: 'Fname',
            lastName: 'Lname',
            gender: 'Male',
            campus: null,
            yearInSchool: 'Senior',
            major: null,
            minor: null,
            birthDate: '1990-01-01',
            dateBecameChristian: null,
            graduationDate: null,
            picture: '',
            userId: 1234567,
            fbUid: 123456789,
            createdAt: '2015-10-20T15:03:39Z',
            updatedAt: '2015-10-26T23:56:05Z',
            organizationalPermission: 7,
            emailAddresses: [
              {
                id: '487976',
                typeJsonapi: 'emailAddress',
                email: 'myname@gmail.com',
                personId: 2829607,
                primary: true,
                createdAt: '2015-10-20T15:00:05Z',
                updatedAt: '2015-10-20T15:03:41Z'
              }
            ],
            interactions: []
          });
        });

      });
      describe('when receiving many resources', function(){
        it('should return an array of compacted objects with relationships inline', function(){
          expect(self.jsonapi.deserialize(self.manyInputs)).toEqual([
            {
              id: '2829607',
              typeJsonapi: 'person',
              firstName: 'Fname',
              lastName: 'Lname',
              gender: 'Male',
              campus: null,
              yearInSchool: 'Senior',
              major: null,
              minor: null,
              birthDate: '1990-01-01',
              dateBecameChristian: null,
              graduationDate: null,
              picture: '',
              userId: 1234567,
              fbUid: 123456789,
              createdAt: '2015-10-20T15:03:39Z',
              updatedAt: '2015-10-26T23:56:05Z',
              organizationalPermission: 7,
              emailAddresses: [
                {
                  id: '487976',
                  typeJsonapi: 'emailAddress',
                  email: 'myname@gmail.com',
                  personId: 2829607,
                  primary: true,
                  createdAt: '2015-10-20T15:00:05Z',
                  updatedAt: '2015-10-20T15:03:41Z'
                }
              ],
              interactions: []
            }
          ]);
        });
      });


    });

    describe('indexIncludes function', function(){
      it('should transform the includes into an object indexed by type and then id', function(){
        expect(self.jsonapi._indexIncludes(self.manyInputs.included)).toEqual({
          email_address: {
            487976: {
              "id": "487976",
              "typeJsonapi": "emailAddress",
              "email": "myname@gmail.com",
              "personId": 2829607,
              "primary": true,
              "createdAt": "2015-10-20T15:00:05Z",
              "updatedAt": "2015-10-20T15:03:41Z"
            }
          }
        });
      });
    });

    describe('flattenData function', function(){
      it('should return a compacted object with attributes inline', function(){
        expect(self.jsonapi._flattenData(self.manyInputs.data[0])).toEqual({
          "id": "2829607",
          "typeJsonapi": "person",
          "firstName": "Fname",
          "lastName": "Lname",
          "gender": "Male",
          "campus": null,
          "yearInSchool": "Senior",
          "major": null,
          "minor": null,
          "birthDate": "1990-01-01",
          "dateBecameChristian": null,
          "graduationDate": null,
          "picture": "",
          "userId": 1234567,
          "fbUid": 123456789,
          "createdAt": "2015-10-20T15:03:39Z",
          "updatedAt": "2015-10-26T23:56:05Z",
          "organizationalPermission": 7
        });
      });

      it('should return a compacted object with attributes and relationships inline', function(){
        var includesMap = self.jsonapi._indexIncludes(self.manyInputs.included);
        expect(self.jsonapi._flattenData(self.manyInputs.data[0], includesMap)).toEqual({
          "id": "2829607",
          "typeJsonapi": "person",
          "firstName": "Fname",
          "lastName": "Lname",
          "gender": "Male",
          "campus": null,
          "yearInSchool": "Senior",
          "major": null,
          "minor": null,
          "birthDate": "1990-01-01",
          "dateBecameChristian": null,
          "graduationDate": null,
          "picture": "",
          "userId": 1234567,
          "fbUid": 123456789,
          "createdAt": "2015-10-20T15:03:39Z",
          "updatedAt": "2015-10-26T23:56:05Z",
          "organizationalPermission": 7,
          "emailAddresses": [
            {
              "id": "487976",
              "typeJsonapi": "emailAddress",
              "email": "myname@gmail.com",
              "personId": 2829607,
              "primary": true,
              "createdAt": "2015-10-20T15:00:05Z",
              "updatedAt": "2015-10-20T15:03:41Z"
            }
          ],
          "interactions": []
        });
      });
    });

    describe('findRelationships function', function() {
      it('should take a relationships object and return a compacted object with loaded includes', function () {
        var includesMap = self.jsonapi._indexIncludes(self.manyInputs.included);
        expect(self.jsonapi._findRelationships(self.manyInputs.data[0].relationships, includesMap)).toEqual({
          email_addresses: [
            {
              "id": "487976",
              "typeJsonapi": "emailAddress",
              "email": "myname@gmail.com",
              "personId": 2829607,
              "primary": true,
              "createdAt": "2015-10-20T15:00:05Z",
              "updatedAt": "2015-10-20T15:03:41Z"
            }
          ],
          interactions: []
        });
      });
    });

    describe('serialize function', function() {
      it('should take a relationships object and return a compacted object with loaded includes', function () {
        expect(self.jsonapi.serialize({
          "id": "2829607",
          "typeJsonapi": "person",
          "firstName": "Fname",
          "lastName": "Lname",
          "gender": "Male",
          "campus": null,
          "yearInSchool": "Senior",
          "major": null,
          "minor": null,
          "birthDate": "1990-01-01",
          "dateBecameChristian": null,
          "graduationDate": null,
          "picture": "",
          "userId": 1234567,
          "fbUid": 123456789,
          "createdAt": "2015-10-20T15:03:39Z",
          "updatedAt": "2015-10-26T23:56:05Z",
          "organizationalPermission": 7,
          responseAttributes: [
            "firstName",
            "lastName",
            "gender",
            "campus",
            "yearInSchool",
            "major",
            "minor",
            "birthDate",
            "dateBecameChristian",
            "graduationDate",
            "picture",
            "userId",
            "fbUid",
            "createdAt",
            "updatedAt",
            "organizationalPermission"
          ]
        })).toEqual({
          data: {
            "id": "2829607",
            "type": "person",
            attributes: {
              "first_name": "Fname",
              "last_name": "Lname",
              "gender": "Male",
              "campus": null,
              "year_in_school": "Senior",
              "major": null,
              "minor": null,
              "birth_date": "1990-01-01",
              "date_became_christian": null,
              "graduation_date": null,
              "picture": "",
              "user_id": 1234567,
              "fb_uid": 123456789,
              "created_at": "2015-10-20T15:03:39Z",
              "updated_at": "2015-10-26T23:56:05Z",
              "organizational_permission": 7
            }
          }
        });
      });
    });
  });
})();

