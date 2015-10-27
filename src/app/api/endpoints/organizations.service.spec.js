(function () {
  'use strict';

  describe('service organizations endpoint', function () {
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

    describe('getCurrentOrganization function', function() {
      it('should return an organization object', function(){
        self.userDetails.setCurrentOrganization(123);
        self.$httpBackend.expectGET('/organizations/123').respond(200, {
          organization: {
            id: 123,
            name: 'Test'
          }
        });
        self.organizations.getCurrentOrganization().then(function(data){
          expect(data).toEqual({
            id: 123,
            name: 'Test'
          });
        });
        self.$httpBackend.flush();
      })
    });

    describe('getOrganizations function', function() {
      it('should return an array of organization objects', function(){
        self.$httpBackend.expectGET('/organizations').respond(200, {
          organizations: [
            {
              id: 123,
              name: 'Test'
            },
            {
              id: 124,
              name: 'Test2'
            }
          ]
        });
        self.organizations.getOrganizations().then(function(data){
          expect(data).toEqual([
            {
              id: 123,
              name: 'Test'
            },
            {
              id: 124,
              name: 'Test2'
            }
          ]);
        });
        self.$httpBackend.flush();
      })
    });
  });
})();

