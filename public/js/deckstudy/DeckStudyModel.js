(function () {
  'use strict';

  /**
   * DeckStudyModel
   *
   * @constructor
   * @param {Object} $rootScope 
   * @param {Object} $http
   * @param {Object} $location
   * @param {StudySession} studySession will contain all information
   *    about the current study session
   */
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
  }

  /**
   * configure
   *
   * @param {Object} deck contains information concerning the deck
   * @param {Object} config contains information about user's stats
   */
  DeckStudyModel.prototype.configure = function (deck, config) { 
    this.flashcards = deck.flashcards; 
    this.session.configure(deck, config);
  };

  /**
   * _sort
   *
   * @param {number} flashcardOrderId specify the order in which
   *    the flashcards should be displayed, it must be one of 
   *    this.session.options.FlashcardOrders values
   */
  DeckStudyModel.prototype.sort = function (flashcardOrderId) {
    var Orders = this.session.options.FlashcardOrders;

    switch (flashcardOrderId) {
      case Orders.CLASSIC           : this._sortByIndex(); break; 
      case Orders.HARDEST_TO_EASIEST: this._sortByDifficulty(); break; 
      case Orders.LEAST_STUDIED     : this._sortByViews(); break; 
      default:
        console.log('unknown order');
        return;
    }

    this.session.options.order = flashcardOrderId;
    this.updateFlashcardOrder(flashcardOrderId);
  };

  /**
   * _sortByDifficulty is used for the 'Hardest to easiest' order
   * @private
   */
  DeckStudyModel.prototype._sortByDifficulty = function () {
    this.flashcards.sort(function (a, b) {
      if (a.status < b.status) { return -1; }
      else if (a.status > b.status) { return 1;}
      else if (a.status === b.status && a.index < b.index) { return -1; }
      else { return 1; }
    });
  };

  /**
   * _sortByViews is used for the 'Least studied' order
   * @private
   */
  DeckStudyModel.prototype._sortByViews = function () {
    this.flashcards.sort(function (a, b) {
      if (a.studied < b.studied) { return -1; }
      else if (a.studied > b.studied) { return 1; }
      else if (a.studied === b.studied && a.index < b.index) { return -1; }
      else { return 1; }
    });
  };

  /**
   * _sortByIndex is used for the 'Classic' order
   * @private
   */
  DeckStudyModel.prototype._sortByIndex = function () {
    this.flashcards.sort(function (a, b) {
      if (a.index < b.index) { return -1; }
      else { return 1; }
    });
  };

  /**
   * updateShowFirst
   *
   * @param {string} side the side which must be displayed first,
   *    can be one of this.session.options.Sides values
   */
  DeckStudyModel.prototype.updateShowFirst = function (side) {
    // TODO check side value and move this.show to the controller
    this.session.options.showFirst = side;
    if (this.visible.term === false || this.visible.definition === false) {
      this.show(this.session.index); // refresh display if a side is still hidden
    }
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

})();
