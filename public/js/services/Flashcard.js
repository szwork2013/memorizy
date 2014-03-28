angular.module('memorizy.services')
.factory('Flashcard', [function () {

  return {
    attrs: [
      'term_text',
      'definition_text'
    ],

    equals: function (f1, f2) {
      if (typeof f1 === 'undefined' || typeof f2 === 'undefined') {
        return false;
      }

      for (var i in this.attrs) {
        if (f1[i] !== f2[i]) {
          return false;
        }
      }

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
