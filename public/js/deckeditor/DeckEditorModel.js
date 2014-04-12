angular.module('memorizy.deckeditor.DeckEditorModel', [])
.provider('DeckEditorModel', function () {

  this.$get = ['$http', '$location', function ($http, $location) {
    return {
      save: function (flashcard) {
        return $http.post('/api' + $location.path(), flashcard, { 
          params: { action: 'saveFlashcard' }
        });
      },

      removeFlashcard: function (flashcardId) {
        return $http.delete('/api' + $location.path(), { 
          params: { 
            action: 'deleteFlashcard',
            flashcardId: flashcardId
          }
        });
      }
    };
  }];
}); 

