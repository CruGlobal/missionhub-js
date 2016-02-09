(function() {
  'use strict';

  angular
    .module('missionhub.api.utils')
    .factory('lokiDB', lokiDBService);

  /** @ngInject */
  function lokiDBService(Loki, rx) {
    var factory = {
      get: get,
      search: search,
      save: save,
      apiImportItem: apiImportItem
    };

    var db;
    var dbLoaded = false;
    var dbLoadingObservable;

    var collections = [];

    activate();

    return factory;

    function activate(){
      var iDBAdapter = new LokiIndexedAdapter('missionhub-loki');
      db = new Loki('missionhub',
        {
          autosave: true,
          autosaveInterval: 1000, // 1 second
          adapter: iDBAdapter
        }
      );
      getDB();
    }

    function getDB(){
      if(dbLoaded) {
        return rx.Observable.just(db);
      }if(dbLoadingObservable) {
        return dbLoadingObservable;
      }else{
        return dbLoadingObservable = rx.Observable.create(function(observer){
          db.loadDatabase({}, function (){
            dbLoaded = true;
            observer.onNext(db);
            observer.onCompleted();
          });
        });
      }
    }


    function collection(name) {
      if (collections[name]) {
        return rx.Observable.just(collections[name]);
      } else {
        return getDB()
          .map(function () {
            var collection = db.getCollection(name);
            if (collection === null) {
              collection = db.addCollection(name, {disableChangesApi: false});
              collection.ensureUniqueIndex('id');
            }
            collections[name] = collection;
            return collection;
          });
      }
    }

    // Get object wrapped in observable
    function get(type, id){
      return collection(type)
        .map(function(collection){
          return collection.by('id', id);
        });
    }

    // Get all objects wrapped in observable
    function search(type, query, order){
      return collection(type)
        .map(function(collection){
          var chain = collection.chain();
          if(query) {
            chain = chain.find(query);
          }
          if(order) {
            chain = chain.simplesort(order.property, order.descending);
          }
          return chain.data();
        });
    }

    function save(type, object){
      return insertOrUpdate(type, object);
    }

    function apiImportItem(type, object){
      return insertOrUpdate(type, object, {disableChanges: true});
    }

    // Insert or update object depending in if it already exists. Return object wrapped in observable
    function insertOrUpdate(type, object, options){
      options = _.defaults(options || {}, {disableChanges: false});
      return collection(type)
        .map(function(collection){
          var existing = collection.by('id', object.id);
          var updatedObj;
          if(options.disableChanges){
            collection.setChangesApi( false );
          }
          if(existing){
            existing = _.merge(existing, object);
            updatedObj = collection.update(existing);
          }else{
            updatedObj = collection.insert(object);
          }
          collection.setChangesApi( true );
          return updatedObj;
        });
    }
  }

})();
