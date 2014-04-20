(function () {
  'use strict';

  function StudyStats ($rootScope, $http, $location) {
    this.$rootScope = $rootScope;
    this.$http = $http;
    this.$location = $location;

    var _answers = [];

    // Not in the prototype since it needs access
    // to a private property
    this.reset = function () { _answers= []; };

    // Allow getters only for these properties, 
    // thus, their addresses cannot be modified
    Object.defineProperties(this, {
      answers: { get: function () { return _answers; } }
    });
  }

  StudyStats.prototype.addAnswer = function (flashcard, correct) {
    console.log('stats: flashcard = ', flashcard);
    this.answers.push({
      id: flashcard.id,
      correct: correct
    });

    this.$rootScope.$emit('answered', { flashcard: flashcard, correct: correct });
  };

  // update stats on remote server
  StudyStats.prototype.update = function () {
    return this.$http.post('/api' + this.$location.path(), this.answers, {
      params: { action: 'updateStats' }
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

