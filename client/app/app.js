(function () {
  'use strict';

  angular.module('memorizy', [
    'memorizy.register',
    'memorizy.registered',
    'memorizy.account',
    'memorizy.finder',
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

    'angular.css.injector',
    'angularFileUpload',
    'ngStorage',

    /* Misc */
    'ngRoute',
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
      templateUrl: '/partials/index/index',
      controller: 'IndexController'
    })
    .when('/login', {
      templateUrl: '/partials/login/login',
      controller: 'LoginController'
    })
    .when('/register', {
      templateUrl: '/partials/register/register',
      controller: 'registerController'
    })
    .when('/registered', {
      templateUrl: '/partials/registered/registered',
      controller: 'registeredController'
    })
    .when('/account', {
      redirectTo: '/account/profile'
    })
    .when('/account/profile', {
      templateUrl: '/partials/account/profile/profile',
      controller: 'profileController'
    })
    .when('/account/password', {
      templateUrl: '/partials/account/password/password',
      controller: 'passwordController'
    })
    .when('/account/settings', {
      templateUrl: '/partials/account/settings/settings',
      controller: 'SettingsController'
    })
    .when('/:username', {
      templateUrl: '/partials/filemanager/filemanager',
      controller: 'FileManagerController'
    })
    .when('/:username/calendar', {
      templateUrl: '/partials/calendar/calendar',
      controller: 'calendarController'
    })
    .when('/:username/calendar/study', {
      templateUrl: '/partials/deck/study/study',
      controller: 'DeckStudyController'
    })
    .when('/:username/:subfolders*', {
      templateUrl: '/partials/filemanager/filemanager',
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
