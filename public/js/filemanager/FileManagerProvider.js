angular.module('memorizy.filemanager.FileManagerProvider', [])
.provider('FileManager', function () {
  this.$get = ['$http', '$location', function ($http, $location) {
    return {
      getAll: function () {
        return $http.get('/api' + $location.path(), {
          params: { action: 'getAll' }
        });
      }
    };
  }];
});



