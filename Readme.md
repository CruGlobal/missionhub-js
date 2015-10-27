# MissionHub AngularJS API Client
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
