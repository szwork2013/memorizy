function DeckStudyModel ($rootScope, $http, $location, studySession) {
  this.$rootScope = $rootScope;
  this.$http = $http;
  this.$location = $location;

  /**
   * contains flashcards in the current
   * order
   */
  this.flashcards = null;

  /**
   * contains every information about the current
   * study session, such as options or stats
   */
  this.session = studySession;

  this._initEventListeners();
}

DeckStudyModel.prototype.configure = function (deck, config) { 
  this.flashcards = deck.flashcards; 
  this.session.configure(deck, config);
};

DeckStudyModel.prototype._initEventListeners = function () {
  var that = this;

  // show stats at the end of the session
  this.$rootScope.$on('end', function () {
    that.updateStats.call(that);
    that.showStats.call(that);
  });
};

DeckStudyModel.prototype.answer = function (id, correct) {
  var c = this.session.stats.correct,
  w = this.session.stats.wrong;

  this.session.stats.answered++;

  if (correct) {
    c.number++;
    c.flashcardIds.push(id);
  }
  else {
    w.number++;
    w.flashcardIds.push(id);
  }

  c.percentage = 100 * c.number / this.session.stats.answered;
  w.percentage = 100 * w.number / this.session.stats.answered;
};

DeckStudyModel.prototype.sort = function (flashcardOrderId) {
  this.deck.flashcard_order_id = flashcardOrderId;
  this.updateFlashcardOrder(flashcardOrderId);
  switch (flashcardOrderId) {
    case 1: this._sortByIndex(); break; 
    case 2: this._sortByDifficulty(); break; 
    case 3: this._sortByViews(); break; 
    default:
      console.log('unknown order');
    break;
  }
};

/**
 * _sortByDifficulty is used for the 
 * 'Hardest to easiest' order
 */
DeckStudyModel.prototype._sortByDifficulty = function () {
  this.deck.flashcards.sort(function (a, b) {
    if (a.state_history < b.state_history) { return -1; }
    else if (a.state_history > b.state_history) { return 1;}
    else if (a.state_history === b.state_history && a.index < b.index) { return -1; }
    else { return 1; }
  });
};

/**
 * _sortByViews is used for the 
 * 'Least studied' order
 */
DeckStudyModel.prototype._sortByViews = function () {
  this.deck.flashcards.sort(function (a, b) {
    if (a.studied < b.studied) { return -1; }
    else if (a.studied > b.studied) { return 1; }
    else if (a.studied === b.studied && a.index < b.index) { return -1; }
    else { return 1; }
  });
};

/**
 * _sortByIndex is used for the 
 * 'Classic' order
 */
DeckStudyModel.prototype._sortByIndex = function () {
  this.deck.flashcards.sort(function (a, b) {
    if (a.index < b.index) { return -1; }
    else { return 1; }
  });
};

DeckStudyModel.prototype.showFirst = function (side) {
  this.session.options.showFirst = side;
  if (this.visible.term === false || this.visible.definition === false) {
    this.show(this.session.index); // refresh display if a side is still hidden
  }

  this.updateShowFirst(side);
};

angular.module('memorizy.deckstudy.DeckStudyModel', [])
.provider('DeckStudyModel', function () {
  this.$get = [
    '$rootScope', '$http', '$location', 'studySession', 
    function ($rootScope, $http, $location, studySession) {
      return new DeckStudyModel ($rootScope, $http, $location, studySession);
    }
  ];
});

