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

    var that = this;
    $rootScope.$on('order', function (event, order) {
      that.sort(order);
    });
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
