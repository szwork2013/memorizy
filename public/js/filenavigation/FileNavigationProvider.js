angular.module('memorizy.filenavigation.FileNavigationProvider', [])
.provider('FileNavigation', function () {

  this.$get = ['$http', '$location', function ($http, $location) {
    return {
      //getAll: function () {
        //return $http.get('/api' + $location.path());
      //},

      getFileTree: function () {
        return $http.get('/api' + $location.path(), {
          params: { action: 'getFileTree' } 
        });
      },

      addFile: function (file) {
        return $http.put('/api' + $location.path() + '/' + file.name, file, {
          params: { action: 'createFile' }
        });
      },

      updateFile: function (file) {
        return $http.put('/api' + $location.path() + '/' + file.name, file);
      },

      renameFile: function (file, newName) {
        return $http.post('/api' + $location.path() + '/' + file.name, {
          fileId: file.id,
          newName: newName
        }, {
          params: { 
            action: 'renameFile'
          }
        });
      },

      moveFile: function (src, dest) {
        // should fix the url
        return $http.put('/api' + $location.path() + '/' + src.name, {
          src: src.id,
          dest: dest.id 
        }, {
          params: { action: 'moveFile' }
        });
      },

      deleteFile: function (file) {
        return $http.delete('/api' + $location.path() + '/' + file.name, { 
          params: {
            action: 'deleteFile',
            fileId: file.id 
          } 
        });
      }
    };
  }];
});
