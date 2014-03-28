angular.module('memorizy.services')
.factory('DeckEditorService', ['$http', '$location', function ($http, $location) {

  return {
    save: function (toSave) {
      return $http.post('/api' + $location.path() + '/' + file.name,
                        toSave, { action: 'saveFlashcards' });
    }
  };

}]); 

