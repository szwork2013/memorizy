function DeckEditorModel ($http, $location) {
  this.$http = $http;
  this.$location = $location;

  this.deck = null;
}

DeckEditorModel.prototype = {
  init: function (deck) {
    this.deck = deck;
  },

  addFlashcard: function () {
    this.deck.flashcards.push({
      deck_id: this.deck.id,
      term_text: '',
      definition_text: ''
    });
  },

  saveFlashcard: function (flashcard) {
    return this.$http.post('/api' + this.$location.path(), flashcard, { 
      params: { action: 'saveFlashcard' }
    });
  },

  removeFlashcard: function (index) {
    var f = this.deck.flashcards[index];
    var ret = this.$http.delete('/api' + this.$location.path(), { 
      params: { 
        action: 'deleteFlashcard',
        flashcardId: f.id 
      }
    });

    this.deck.flashcards.splice(index, 1);
    return ret;
  }
};

angular.module('memorizy.deckeditor.DeckEditorModel', []).
  provider('DeckEditorModel', function () {
    this.$get = ['$http', '$location', function ($http, $location) {
      return new DeckEditorModel($http, $location);
    }];
  }); 

