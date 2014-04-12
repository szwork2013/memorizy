function DeckEditorModel ($http, $location) {
  this.$http = $http;
  this.$location = $location;
}

DeckEditorModel.prototype = {
  save: function (flashcard) {
    return this.$http.post('/api' + this.$location.path(), flashcard, { 
      params: { action: 'saveFlashcard' }
    });
  },

  removeFlashcard: function (flashcardId) {
    return this.$http.delete('/api' + this.$location.path(), { 
      params: { 
        action: 'deleteFlashcard',
        flashcardId: flashcardId
      }
    });
  }
};

angular.module('memorizy.deckeditor.DeckEditorModel', []).
  provider('DeckEditorModel', function () {
    this.$get = ['$http', '$location', function ($http, $location) {
      return new DeckEditorModel($http, $location);
    }];
  }); 

