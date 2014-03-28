angular.module('memorizy', [
  'memorizy.controllers',
  'memorizy.filters',
  'memorizy.services',
  'memorizy.directives',
  'ngRoute'
])
.config(function ($routeProvider, $locationProvider) {
  $routeProvider.when('/', {
    templateUrl: '/partials/index',
    controller: 'IndexCtrl'
  })
  .when('/:username', {
    templateUrl: '/partials/file-manager',
    controller: 'FileManagerCtrl'
  })
  .when('/:username/:subfolders*', {
    templateUrl: '/partials/file-manager',
    controller: 'FileManagerCtrl'
  })
  .otherwise({
    redirectTo: '/'
  });

  $locationProvider.html5Mode(true);
});

angular.module('memorizy.controllers', []);
angular.module('memorizy.services', ['ngResource']);
angular.module('memorizy.directives', []);
angular.module('memorizy.filters', []);

//angular.element(document).ready(function() {
  //angular.bootstrap(document.getElementById('appRoot'), ['memorizy']);
//});
