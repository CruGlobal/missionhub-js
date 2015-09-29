angular.module('missionhub')
  .filter('personAvatar', function() {
    return function (person, size) {
      size = size || 40;

      if (!person || !person.first_name) {
        return '';
      }
      if (person.picture) {
        return person.picture + '?width=' + size + '&height=' + size;
      }

      // from http://stackoverflow.com/a/16348977/879524
      var colour = '444444';
      // str to hash
      for (var i = 0, hash = 0; i < person.first_name.length; hash = person.first_name.charCodeAt(i++) + ((hash << 5) - hash));
      // int/hash to hex
      for (var i = 0, colour = ""; i < 3; colour += ("00" + ((hash >> i++ * 8) & 0xFF).toString(16)).slice(-2));

      return "https://avatars.discourse.org/letter/" + person.first_name.slice(0,1) + "/" + colour +
        "/" + size + ".png";
    };
  })
  .filter('personPrimaryPhone', function() {
    return function (person) {

      if (!person || !person.phone_numbers || person.phone_numbers.length == 0) {
        return '';
      }
      var i = 0;
      while (i < person.phone_numbers.length) {
        if(person.phone_numbers[i].primary)
          return person.phone_numbers[i].number;
        i++;
      }
      return person.phone_numbers[0].number;
    };
  })
  .filter('personFullname', function(){
    return function(person) {
      if (!person || !person.first_name) {
        return '';
      }
      return person.first_name + ' ' + person.last_name;
    };
  });
