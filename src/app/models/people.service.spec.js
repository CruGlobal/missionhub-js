(function () {
  'use strict';

  describe('service people', function () {
    var self = {};

    beforeEach(module('missionhub.api'));

    beforeEach(function(){
      inject(function($httpBackend, people, userDetails) {
        self.$httpBackend = $httpBackend;
        self.people = people;
        self.userDetails = userDetails;
      });
      self.userDetails.setCurrentOrganization({id: 123, name: 'Test'});
    });

    it('should be registered', function () {
      expect(self.people).toBeDefined();
    });

    describe('getAll function', function() {
      it('should return an array of people objects', function(){
        var responseData = [
          {
            id: 56,
            type: 'v4_people',
            attributes: {
              first_name: 'Fname',
              last_name: 'Lname'
            }
          },
          {
            id: 57,
            type: 'v4_people',
            attributes: {
              first_name: 'Fname2',
              last_name: 'Lname2'
            }
          }
        ];
        self.$httpBackend.expectGET('/organizations/123/people').respond(200, {
          data: responseData
        });
        self.people.all().then(function(data){
          expect(data.plain()).toEqual(responseData);
        });
        self.$httpBackend.flush();
      });
    });

    describe('getCurrent function', function() {
      it('should return the people object for the current person', function(){
        self.userDetails.setPersonId(10);
        self.$httpBackend.expectGET('/organizations/123/people/10').respond(200, {
          data: {
            id: 10,
            type: 'v4_people',
            attributes: {
              first_name: 'Fname',
              last_name: 'Lname'
            }
          }
        });
        self.people.current().then(function(data){
          expect(data.plain()).toEqual({
            id: 10,
            type: 'v4_people',
            attributes: {
              first_name: 'Fname',
              last_name: 'Lname'
            },
            meta: undefined,
            included: undefined
          });
        });
        self.$httpBackend.flush();
      });
    });
  });
})();

