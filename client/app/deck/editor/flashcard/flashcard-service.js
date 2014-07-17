angular.module('memorizy.flashcard.FlashcardService', [])
.service('flashcardService', [function () {
  this.attrs = [
    'term_text',
    'definition_text',
    'term_media_id',
    'term_media_position',
    'definition_media_id',
    'definition_media_position'
  ];

  this.equals = function (f1, f2) {
    if (typeof f1 === 'undefined' || typeof f2 === 'undefined') {
      return false;
    }

    for (var i in this.attrs) {
      var prop = this.attrs[i];
      if (f1[prop] !== f2[prop]) {
        return false;
      }
    }

    return true;
  };

  this.clone = function (flashcard) {
    var clone = {};
    for (var i in this.attrs) {
      var prop = this.attrs[i];
      clone[prop] = flashcard[prop];
    }

    return clone;
  };

  this.MediaPositions = {
    FULL : 'full',
    RIGHT: 'right',
    LEFT : 'left'
  };
}]);
