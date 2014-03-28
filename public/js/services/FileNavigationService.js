angular.module('memorizy.services')
.factory('FileNavigationService', 
  ['$http', '$location', function ($http, $location) {

    return {
      addFile: function (file) {
        return $http.put('/api' + $location.path() + '/' + file.name, file);
      },

      updateFile: function (file) {
        return $http.put('/api' + $location.path() + '/' + file.name, file);
      },

      removeFile: function (file) {
        return $http.delete('/api' + $location.path() + '/' + file.name, 
                            { params: {fileId: file.id } });
      }
    };
  }]);
