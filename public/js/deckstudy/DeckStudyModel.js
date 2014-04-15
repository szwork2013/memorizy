function DeckStudyModel ($rootScope, $http, $location) {
  this.$rootScope = $rootScope;
  this.$http = $http;
  this.$location = $location;

  /**
   * contains flashcards in the current
   * order
   */
  this.deck = null;

  /**
   * contains every information about the current
   * study session, such as options or stats
   */
  this.session = null;
}

DeckStudyModel.prototype = {
  init: function (deck) { 
    this.deck = deck; 

    this.session = {
      index: 0,

      options: {
        showFirst: deck.show_first,
        method: deck.study_method,
        subdeckSize: 10 // used only if method === StudyMethods.GET100
      },

      stats: {
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
      },

      subdeck: {
        index: 0,
        flashcards: [],
      }
    };

    this.visible = {
      term: false,
      definition: false,
      answerButtons: false,
      stats: false
    };

    this._initEventListeners();
  },

  _initEventListeners: function () {
    var that = this;

    // show stats at the end of the session
    this.$rootScope.$on('end', function () {
      that.updateStats.call(that);
      that.showStats.call(that);
    });
  },

  show: function (index) {
    if (index >= this.deck.flashcards.length) {
      this.$rootScope.$emit('end');
    }
    else {
      this.session.index = index;
      this.visible.answerButtons = false;
      switch(this.session.options.showFirst) {
        case 'Term':
          this.visible.term = true;
        this.visible.definition = false;
        break;
        case 'Definition':
          this.visible.term = false;
        this.visible.definition = true;
        break;
        case 'Random':
          if (Math.random() < 0.5) {
          this.visible.term = true;
          this.visible.definition = false;
        }
        else {
          this.visible.term = false;
          this.visible.definition = true;
        }
        break;
        case 'Both':
          this.visible.term = true;
        this.visible.definition = true;
        this.visible.answerButtons = true;
        break;
        default:
          console.log('this.session.options.visible.showFirst value cannot be handled');
        break;
      }
    }
  },

  showAll: function () {
    this.visible.term = true;
    this.visible.definition = true;

    this.visible.answerButtons = true;
  },

  showStats: function () {
    this.visible.stats = true;
  },

  updateStats: function (stats) {
    return this.$http.post('/api' + this.$location.path(), stats, {
      params: { action: 'updateStats' }
    });
  },

  answer: function (id, correct) {
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
  },

  updateFlashcardOrder: function (flashcardOrderId) {
    return this.$http.put('/api' + this.$location.path(), { 
      fileId: this.deck.id,
      flashcardOrderId: flashcardOrderId
    }, { 
      params: {
        action: 'updateFlashcardOrder',
      }
    });
  },

  sort: function (flashcardOrderId) {
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
  },

  /**
   * _sortByDifficulty is used for the 
   * 'Hardest to easiest' order
   */
  _sortByDifficulty: function () {
    this.deck.flashcards.sort(function (a, b) {
      if (a.state_history < b.state_history) { return -1; }
      else if (a.state_history > b.state_history) { return 1;}
      else if (a.state_history === b.state_history && a.index < b.index) { return -1; }
      else { return 1; }
    });
  },

  /**
   * _sortByViews is used for the 
   * 'Least studied' order
   */
  _sortByViews: function () {
    this.deck.flashcards.sort(function (a, b) {
      if (a.studied < b.studied) { return -1; }
      else if (a.studied > b.studied) { return 1; }
      else if (a.studied === b.studied && a.index < b.index) { return -1; }
      else { return 1; }
    });
  },

  /**
   * _sortByIndex is used for the 
   * 'Classic' order
   */
  _sortByIndex: function () {
    this.deck.flashcards.sort(function (a, b) {
      if (a.index < b.index) { return -1; }
      else { return 1; }
    });
  },

  updateShowFirst: function (side) {
    return this.$http.put('/api' + this.$location.path(), { 
      fileId: this.deck.id,
      showFirst: side
    }, { 
      params: {
        action: 'updateShowFirst',
      }
    });
  },

  showFirst: function (side) {
    this.session.options.showFirst = side;
    if (this.visible.term === false || this.visible.definition === false) {
      this.show(this.session.index); // refresh display if a side is still hidden
    }

    this.updateShowFirst(side);
  },

  /** @enum */
  StudyMethods: {
    CLASSIC: 'classic',
    GET100 : 'get100'
  },

  updateStudyMethod: function (method) {
    switch (method) {
      case this.StudyMethods.CLASSIC: break;
      case this.StudyMethods.GET100: break;
      default: 
        console.log('unhandled study method: ', method);
        return;
    }

    return this.$http.put('/api' + this.$location.path(), { 
      fileId: this.deck.id,
      studyMethod: method
    }, { 
      params: {
        action: 'updateStudyMethod'
      }
    });
  }

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

