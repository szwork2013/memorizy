angular.module('memorizy', [
  'memorizy.login',
  'memorizy.filemanager',
  'memorizy.filenavigation',
  'memorizy.deckeditor',
  'memorizy.deckstudy',
  'memorizy.flashcard',
  'memorizy.focus',
  'memorizy.keyboard',
  'memorizy.mouse',
  'memorizy.contenteditable',
  'memorizy.encodeURI',

  'http-auth-interceptor',

  /* Misc */
  'ngRoute'
])
.factory('authInterceptor', function ($rootScope, $q, $window) {
  return {
    request: function (config) {
      console.log('intercept');
      config.headers = config.headers || {};
      if ($window.sessionStorage.token) {
        config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
      }
      return config;
    },
    response: function (response) {
      if (response.status === 401) {
        // handle the case where the user is not authenticated
        console.log('bad login');
      }
      return response || $q.when(response);
    }
  };
})
.config(function ($routeProvider, $locationProvider, $httpProvider) {
  $routeProvider.when('/', {
    templateUrl: '/partials/index',
    controller: 'IndexCtrl'
  })
  .when('/login', {
    templateUrl: '/partials/login',
    controller: 'LoginCtrl'
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

  $httpProvider.interceptors.push('authInterceptor');
})
.run(function ($rootScope, $location) {
  $rootScope.$location = $location; 
  $rootScope.user = null;
});
