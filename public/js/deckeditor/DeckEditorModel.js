angular.module('memorizy.deckeditor.DeckEditorModel', [])
.provider('DeckEditorModel', function () {

  this.$get = ['$http', '$location', function ($http, $location) {
    return {
      save: function (flashcard) {
        return $http.post('/api' + $location.path(), flashcard, { 
          params: { action: 'saveFlashcard' }
        });
      }
    };
  }];
}); 

