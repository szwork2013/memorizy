(function () {
  'use strict';

  function StudyStats ($rootScope, $http, $location) {
    this.$rootScope = $rootScope;
    this.$http = $http;
    this.$location = $location;

    var _answers = {};

    this.reset = function () { _answers= {}; };

    Object.defineProperties(this, {
      answers: { get: function () { return _answers; } }
    });

    $rootScope.$on('end', this.update.bind(this));
  }

  StudyStats.prototype.setStatus = function (flashcard, status) {
    this.answers[flashcard.id] = status;
    this.$rootScope.$emit('answered', { flashcard: flashcard, status: status});
  };

  // update stats on remote server
  StudyStats.prototype.update = function () {
    return this.$http.put('/api' + this.$location.path(), this.answers, {
      params: { action: 'updateStatus' }
    });
  };

  angular.module('memorizy.deckstudy.StudyStats', []). 
    provider('studyStats', function () {
    this.$get = [
      '$rootScope', 
      '$http', 
      '$location', 
      function ($rootScope, $http, $location) {
        return new StudyStats($rootScope, $http, $location);
      }
    ];
  });

})();

