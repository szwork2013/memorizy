function DeckStudyModel ($rootScope, $http, $location) {
  this.$rootScope = $rootScope;
  this.$http = $http;
  this.$location = $location;

  this.deck = null;

  this.studyOpt = {
    showFirst: 'term'
  };

  this.visible = {
    term: false,
    definition: false,
    answerButtons: false,
    stats: false
  };

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
}

DeckStudyModel.prototype.init = function (deck) { 
  this.deck = deck; 
  this._initEventListeners();
};

DeckStudyModel.prototype._initEventListeners = function () {
  var that = this;

  this.$rootScope.$on('end', function () {
    that.updateStats.call(that);
    that.showStats.call(that);
  });
};

DeckStudyModel.prototype.show = function (index) {
  if (index >= this.deck.flashcards.length) {
    this.$rootScope.$emit('end');
  }
  else {
    this.deck.active = index;
    this.visible.answerButtons = false;
    switch(this.studyOpt.showFirst) {
      case 'term':
        this.visible.term = true;
      this.visible.definition = false;
      break;
      case 'definition':
        this.visible.term = false;
      this.visible.definition = true;
      break;
      case 'random':
        if (Math.random() < 0.5) {
        this.visible.term = true;
        this.visible.definition = false;
      }
      else {
        this.visible.term = false;
        this.visible.definition = true;
      }
      break;
      case 'both':
        this.visible.term = true;
      this.visible.definition = true;
      this.visible.answerButtons = true;
      break;
      default:
        console.log('this.studyOpt.visible.First value cannot be handled');
      break;
    }
  }
};

DeckStudyModel.prototype.showAll = function () {
  this.visible.term = true;
  this.visible.definition = true;

  this.visible.answerButtons = true;
};

DeckStudyModel.prototype.showStats = function () {
  this.visible.stats = true;
};

DeckStudyModel.prototype.updateStats = function (stats) {
  return $http.post('/api' + $location.path(), stats, {
    params: { action: updateStats }
  });
};

DeckStudyModel.prototype.answer = function (id, correct) {
  var c = this.stats.correct,
  w = this.stats.wrong;

  this.stats.answered++;

  if (correct) {
    c.number++;
    c.flashcardIds.push(id);
  }
  else {
    w.number++;
    w.flashcardIds.push(id);
  }

  c.percentage = 100 * c.number / this.stats.answered;
  w.percentage = 100 * w.number / this.stats.answered;
};

DeckStudyModel.prototype.updateStudyOrder = function (file, studyOrderId) {
  return this.$http.put('/api' + this.$location.path(), { 
    fileId: file.id,
    studyOrderId: studyOrderId
  }, { 
    params: {
      action: 'updateStudyOrder',
    }
  });
};

angular.module('memorizy.deckstudy.DeckStudyModel', [])
.provider('DeckStudyModel', function () {
  this.$get = [
    '$rootScope', '$http', '$location', 
    function ($rootScope, $http, $location) {
      return new DeckStudyModel ($rootScope, $http, $location);
    }
  ];
});

