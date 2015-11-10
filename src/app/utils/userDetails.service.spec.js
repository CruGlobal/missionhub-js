(function () {
  'use strict';

  describe('service userDetails', function () {
    var self = {};
    beforeEach(module('missionhub.api.utils'));

    beforeEach(function(){
      inject(function(userDetails, localStorageService) {
        self.userDetails = userDetails;
        self.localStorageService = localStorageService;
      });
    });

    it('should be registered', function () {
      expect(self.userDetails).toBeDefined();
    });

    describe('user details functions', function(){
      var test_details = {
        first_name: 'Joe',
        last_name: 'Smith',
        person_id: '1234',
        profile_image_url: 'someUrl',
        recent_organization: {
          id: '4321',
          name: 'Test'
        }
      };
      beforeEach(function(){
        self.localStorageService.set('firstName', test_details.first_name);
        self.localStorageService.set('lastName', test_details.last_name);
        self.localStorageService.set('personId', test_details.person_id);
        self.localStorageService.set('profilePicture', test_details.profile_image_url);
        self.localStorageService.set('currentOrganization', test_details.recent_organization);
      });
      describe('firstName getters and setters', function(){
        it('should return the user\'s first name', function(){
          expect(self.userDetails.getFirstName()).toEqual(test_details.first_name);
        });
        it('should change the user\'s first name', function(){
          self.userDetails.setFirstName('newFirstName');
          expect(self.userDetails.getFirstName()).toEqual('newFirstName');
        });
      });
      describe('lastName getters and setters', function(){
        it('should return the user\'s last name', function(){
          expect(self.userDetails.getLastName()).toEqual(test_details.last_name);
        });
        it('should change the user\'s last name', function(){
          self.userDetails.setLastName('newLastName');
          expect(self.userDetails.getLastName()).toEqual('newLastName');
        });
      });
      describe('personId getters and setters', function(){
        it('should return the user\'s person id', function(){
          expect(self.userDetails.getPersonId()).toEqual(test_details.person_id);
        });
        it('should change the user\'s person id', function(){
          self.userDetails.setPersonId('5678');
          expect(self.userDetails.getPersonId()).toEqual('5678');
        });
      });
      describe('profilePicture getters and setters', function(){
        it('should return the user\'s profile picture', function(){
          expect(self.userDetails.getProfilePicture()).toEqual(test_details.profile_image_url);
        });
        it('should change the user\'s profile picture', function(){
          self.userDetails.setProfilePicture('newPicture');
          expect(self.userDetails.getProfilePicture()).toEqual('newPicture');
        });
      });
      describe('currentOrg getters and setters', function(){
        it('should return the user\'s current org', function(){
          expect(self.userDetails.getCurrentOrganization()).toEqual(test_details.recent_organization);
        });
        it('should change the user\'s current org', function(){
          var newOrg = {
            id: 2,
            name: 'New Org'
          };
          self.userDetails.setCurrentOrganization(newOrg);
          expect(self.userDetails.getCurrentOrganization()).toEqual(newOrg);
        });
      });
      describe('clearAll function', function(){
        it('should delete all userDetails from localStorage', function(){
          self.userDetails.clearAll();
          expect(self.userDetails.getFirstName()).toEqual(null);
          expect(self.userDetails.getLastName()).toEqual(null);
          expect(self.userDetails.getPersonId()).toEqual(null);
          expect(self.userDetails.getProfilePicture()).toEqual(null);
          expect(self.userDetails.getCurrentOrganization()).toEqual(null);
        });
      });
    });
  });
})();

