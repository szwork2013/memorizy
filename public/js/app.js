angular.module('memorizy', [
  'memorizy.filemanager',
  'memorizy.filenavigation',
  'memorizy.deckeditor',
  'memorizy.deckstudy',
  'memorizy.focus',
  'memorizy.keyboard',
  'memorizy.mouse',
  'memorizy.contenteditable',

  /* Misc */
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

