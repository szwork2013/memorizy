(function () {
  'use strict';
  angular.module('memorizy.filemanager.FileManagerProvider', [])
  .provider('FileManager', function () {
    this.$get = ['$http', '$location', function ($http, $location) {
      return {
        getFiles: function (fileIds) {
          if (fileIds) {
            return $http.get('/api' + $location.path(), {
              params: { 
                action: 'getFiles',
                locations: fileIds
              }
            });
          }

          return $http.get('/api' + $location.path(), {
            params: { 
              action: 'getFiles',
              locations: $location.path()
            }
          });
        }
      };
    }];
  });
})();
