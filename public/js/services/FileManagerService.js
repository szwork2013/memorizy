angular.module('memorizy.services')
.factory('FileManagerService', 
  ['$http', '$location', function ($http, $location) {

    return {
      getAll: function () {
        return $http.get('/api' + $location.path());
      },
    };
}]);



