function StudyStats ($http, $location) {
  this.$http = $http;
  this.$location = $location;
}

StudyStats.prototype.reset = function () {
  this.answered = 0;
  this.correct = {
    number: 0,
    percentage: 0,
    flashcardIds: []
  };
  this.wrong = {
    number: 0,
    percentage: 0,
    flashcardIds: []
  };
};

StudyStats.prototype.update = function (stats) {
  return this.$http.post('/api' + this.$location.path(), stats, {
    params: { action: 'updateStats' }
  });
};

angular.module('memorizy.deckstudy.StudyStats', []). 
  provider('studyStats', function () {
  this.$get = ['$http', '$location', function ($http, $location) {
    return new StudyStats($http, $location);
  }];
});
