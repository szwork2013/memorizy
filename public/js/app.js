(function () {
  'use strict';

  angular.module('memorizy', [
    'memorizy.navbar',
    'memorizy.path',
    'memorizy.login',
    'memorizy.filemanager',
    'memorizy.filenavigation',
    'memorizy.markdown',
    'memorizy.deckeditor',
    'memorizy.deckstudy',
    'memorizy.calendar',
    'memorizy.flashcard',
    'memorizy.focus',
    'memorizy.keyboard',
    'memorizy.mouse',
    'memorizy.contenteditable',
    'memorizy.encodeURI',
    'memorizy.input',
    'memorizy.socketio',

    //'http-auth-interceptor',
    'angular.css.injector',
    'angularFileUpload',

    /* Misc */
    'ngRoute',
    'ngStorage',
    'ngSanitize'
  ]).
    
  /**
   * intercept all http requests and manage user session 
   */
  factory('authInterceptor', function ($rootScope, $q, $localStorage) {
    return {
      request: function (config) {
        config.headers = config.headers || {};
        // send the session token at every request, if any
        if ($localStorage.token) {
          config.headers.Authorization = 'Bearer ' + $localStorage.token;
        }
        return config;
      },

      response: function (response) {
        return response || $q.when(response);
      },

      responseError: function(rejection) {
        // remove current token and user information
        // if the server rejected the token, if they
        // exists
        if (rejection.status === 401) {
          delete $localStorage.token;
          delete $localStorage.user;

          // the login form is displayed when
          // the root scope does not have a property
          // called 'user'
          $rootScope.user = null;
        }

        return $q.reject(rejection);
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
      controller: 'FileManagerController'
    })
    .when('/:username/calendar', {
      templateUrl: '/partials/calendar',
      controller: 'CalendarController'
    })
    .when('/:username/calendar/study', {
      templateUrl: '/partials/deck-study',
      controller: 'DeckStudyController'
    })
    .when('/:username/:subfolders*', {
      templateUrl: '/partials/file-manager',
      controller: 'FileManagerController'
    })
    .otherwise({
      redirectTo: '/'
    });

    $locationProvider.html5Mode(true);

    $httpProvider.interceptors.push('authInterceptor');
  })
  .run(function ($rootScope, $location, $localStorage) {
    // used for relative path 
    $rootScope.$location = $location; 

    // get insensitive information about the logged user
    $rootScope.user = $localStorage.user;
  });
})();
