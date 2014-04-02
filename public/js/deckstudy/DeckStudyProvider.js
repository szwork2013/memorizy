angular.module('memorizy.deckstudy.DeckStudyProvider', [])
.provider('DeckStudy', function () {
  this.stats = {
    answered: 0,
    correct: {
      number: 0,
      percentage: 0,
      flashcardIds: []
    },
    wrong: {
      number: 0,
      percentage: 0,
      flashcardIds: []
    }
  };

  this.$get = ['$http', '$location', function ($http, $location) {
    return {
      stats: this.stats,

      updateStats: function (stats) {
        return $http.post('/api' + $location.path(), stats, {
          params: { action: updateStats }
        });
      }
    };
  }];

}); 


