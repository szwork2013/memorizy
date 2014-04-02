angular.module('memorizy.filenavigation.FileNavigationProvider', [])
.provider('FileNavigation', function () {

  this.$get = ['$http', '$location', function ($http, $location) {
    return {
      getAll: function () {
        return $http.get('/api' + $location.path());
      },

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
  }];
});
