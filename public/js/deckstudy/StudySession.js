function StudySession (studyOptions, studyStats) {
  this.options = studyOptions;
  this.stats = studyStats;
}

StudySession.prototype.configure = function (deck, config) {
  this.deck = deck;
  this.index = 0;
  this.options.configure(this, config);
  this.stats.reset();
};

angular.module('memorizy.deckstudy.StudySession', []). 
  provider('studySession', function () {
  this.$get = [
    'studyOptions',
    'studyStats',
    function (studyOptions, studyStats) {
      return new StudySession(studyOptions, studyStats);
    }
  ];
});

