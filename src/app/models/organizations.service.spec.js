(function () {
  'use strict';

  describe('service organizations', function () {
    var self = {};

    beforeEach(module('missionhub.api'));

    beforeEach(function(){
      inject(function($httpBackend, organizations, userDetails) {
        self.$httpBackend = $httpBackend;
        self.organizations = organizations;
        self.userDetails = userDetails;
      });
    });

    it('should be registered', function () {
      expect(self.organizations).toBeDefined();
    });

    describe('getAll function', function() {
      it('should return an array of organization objects', function(){
        var responseData = [
          {
            id: 123,
            type: 'v4_organizations',
            attributes: {
              name: 'Test'
            }
          },
          {
            id: 124,
            type: 'v4_organizations',
            attributes: {
              name: 'Tes2'
            }
          }
        ];
        self.$httpBackend.expectGET('/organizations').respond(200, {
          data: responseData
        });
        self.organizations.all().then(function(data){
          expect(data.plain()).toEqual(responseData);
        });
        self.$httpBackend.flush();
      });
    });

    describe('getCurrent function', function() {
      it('should return an organization object', function(){
        self.userDetails.setCurrentOrganization({id: 123, name: 'Test'});
        self.$httpBackend.expectGET('/organizations/123').respond(200, {
          data: {
            id: 123,
            type: 'v4_organizations',
            attributes: {
              name: 'Test'
            }
          }
        });
        self.organizations.current().then(function(data){
          expect(data.plain()).toEqual({
            id: 123,
            type: 'v4_organizations',
            attributes: {
              name: 'Test'
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

