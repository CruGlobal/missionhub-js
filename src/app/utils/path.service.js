(function() {
  'use strict';

  angular
    .module('missionhub.api.utils')
    .provider('pathUtils', pathProvider);

  /** @ngInject */
  function pathProvider(_) {
    var providerFactory = {
      $get: pathService,
      parse: parse,
      concat: concat
    };

    return providerFactory;
  }

  function pathService(_) {
    var factory = {
      parse: parse,
      concat: concat
    };

    return factory;
  }

  function parse(path){
    if(_.isArray(path)){
      path = _.join(path, '/');
    }
    if(_.isString(path)) {
      return _.replace(path, '/(^\/)|(\/$)/g', '');
    }else{
      throw new Error('Path is not a string or array');
    }
  }

  function concat(paths){
    return _.join(_.compact(paths), '/');
  }

})();
