angular.module('memorizy.services')
.factory('Flashcard', [function () {

  return {
    attrs: [
      'term_text',
      'definition_text'
    ],

    equals: function (f1, f2) {
      if (typeof f1 === 'undefined' || typeof f2 === 'undefined') {
        console.log('1');
        return false;
      }

      for (var i in this.attrs) {
        var prop = this.attrs[i];
        if (f1[prop] !== f2[prop]) {
          return false;
        }
      }

      console.log('equals');

      return true;
    },

    clone: function (flashcard) {
      var clone = {};
      for (var i in this.attrs) {
        clone[i] = flashcard[i];
      }

      return clone;
    }
  };
}]);
