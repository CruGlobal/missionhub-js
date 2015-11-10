(function() {
  'use strict';

  angular
    .module('missionhub.api')
    .config(config);

  /** @ngInject */
  function config(localStorageServiceProvider, RestangularProvider, _) {
    localStorageServiceProvider.setPrefix('mh.user');

    // Handler for JSON API includes. See:
    // - https://github.com/mgonto/restangular/issues/877
    // - https://gist.github.com/pywebdesign/a81755c46f041bed6cf1
    RestangularProvider.addResponseInterceptor(function(data/*, operation, what, url, response, deferred*/) {
      var extractedData = data.data;
      extractedData.meta = data.meta;
      extractedData.included = data.included;

      function _apply(elem, fct){
        if(elem !== undefined){
          if(elem.type !== undefined){
            fct(elem);
          }else{
            _.forEach(elem, function(el){
              _apply(el, fct);
            });
          }
        }
      }

      _apply(data.data, function(elem){
        _apply(elem.relationships, function(rel){
          rel.getIncluded = function(){
            return _.find(extractedData.included, function(included){
              var a = included.type === rel.type;
              var b = included.id === rel.id;
              return a && b;
            });
          };
        });
      });
      return extractedData;
    });
  }

})();
