angular.module('memorizy.services')
.factory('DeckEditorService', ['$http', '$location', function ($http, $location) {

  return {
    save: function (flashcard) {
      return $http.post('/api' + $location.path(), flashcard, { 
        params: { action: 'saveFlashcard' }
      });
    },

    remove: function (id) {
      console.log('remove id ' + id);
      return $http.delete('/api' + $location.path(), {
        params: { 
          action: 'deleteFlashcard',
          flashcardId: id
        }
      });
    },
  };

}]); 

