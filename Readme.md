# MissionHub AngularJS API Client
[![Build Status](https://travis-ci.org/CruGlobal/missionhub-js.svg?branch=master)](https://travis-ci.org/CruGlobal/missionhub-js)
[![Coverage Status](https://coveralls.io/repos/CruGlobal/missionhub-js/badge.svg?branch=master&service=github)](https://coveralls.io/github/CruGlobal/missionhub-js?branch=master)
## Installation
To install this package in your AngularJS app run:
```bash
bower install missionhub-js
```

## Usage
### Include in App Module
```JavaScript
angular
  .module('missionhub', ['missionhub.api']);
```

### Config
```JavaScript
angular
  .module('missionhub')
  .config(config);

/** @ngInject */
function config(apiProvider) {
  apiProvider.baseUrl = 'https://stage.missionhub.com/apis/v4';
}
```

### Inject into controller or service
```JavaScript
function MyController(api, userDetails) {
  var vm = this;
  vm.userDetails = userDetails;

  activate();

  function activate() {
    api.organizations.get().then(function(data){
      console.log('orgs:', data);
    });
  }
}
```

# API Reference
## API Service
### Organizations
- [`api.organizations.all()`](#apiorganizationsall)
- [`api.organizations.current()`](#apiorganizationscurrent)

## User Details Service
- `userDetails.getFirstName()`
- `userDetails.setFirstName(value)`
- `userDetails.getLastName()`
- `userDetails.setLastName(value)`
- `userDetails.getPersonId()`
- `userDetails.setPersonId(value)`
- `userDetails.getProfilePicture()`
- `userDetails.setProfilePicture(value)`
- `userDetails.getCurrentOrganization()`
- `userDetails.setCurrentOrganization(value)`
- `userDetails.clearAll()`

#### `api.organizations.all()`
Return all organizations that the user has access to.

##### Usage:
```JavaScript
api.organizations.all()
  .then(function(response){
    //response contains an array of organization objects
  });
```

##### Response
```JSON
[
  {
    "id": 8953,
    "name": "Test",
    "terminology": "Organization",
    "ancestry": null,
    "show_sub_orgs": true,
    "status": "active",
    "created_at": "2015-10-20T12:05:11-03:00",
    "updated_at": "2015-10-20T12:05:11-03:00"
  }
]
```

#### `api.organizations.current()`
Return the current organization. Current organization id is loaded from `userDetails.getCurrentOrganization()`

##### Usage:
```JavaScript
api.organizations.current()
  .then(function(response){
    //response contains the organization object
  });
```

##### Response
```JSON
{
  "id": 8953,
  "name": "Test",
  "terminology": "Organization",
  "ancestry": null,
  "show_sub_orgs": true,
  "status": "active",
  "created_at": "2015-10-20T12:05:11-03:00",
  "updated_at": "2015-10-20T12:05:11-03:00"
}
```

## Development
### Environment Setup
1. Install NodeJS. This will vary depending on your Operating System.
2. Clone this repo and open a terminal in that folder.
3. Run `npm install` to install the command line tools.
4. Run `bower install` to install the web app dependencies.
5. Run `gulp`. This command will build the project and output js files to `/dist`.

### Linking to Angular Project
To develop locally with the missionhub-js package and have your project use these local files you can use [`bower link`](http://bower.io/docs/api/#link).

- In this local copy of missionhub-js, run `bower link` to create a global link to this package
- Then in your project, run `bower link missionhub-js` to symlink `/bower_components/missionhub-js` to this local package 
