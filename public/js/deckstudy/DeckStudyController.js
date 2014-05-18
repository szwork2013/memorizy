(function () {
  'use strict';
  function DeckStudyController ($rootScope, $scope, $document, SessionManager, keyboardManager) {
    this.$scope = $scope;

    // $scope.decks is inherited from a parent scope
    
    SessionManager.configure($scope.decks);
    $scope.SessionManager = SessionManager;

    $scope.visible = {
      term: false,
      definition: false,
      answerButtons: false,
      stats: false
    };

    $scope.showAll = this.showAll.bind(this);
    $scope.stringifyFlashcardOrder = this.stringifyFlashcardOrder.bind(this);

    $scope.$watch('SessionManager.activeSessionIdx', function (n, o) {
      $scope.session = SessionManager.sessions[SessionManager.activeSessionIdx];
      $scope.flashcards = SessionManager.
        sessions[SessionManager.activeSessionIdx].deck.flashcards;
      $scope.options = SessionManager.
        sessions[SessionManager.activeSessionIdx].options;
    });

    /* watchers */
    $scope.$watch('session.options.showFirst', function () {
      this.show(this.$scope.session.index);
    }.bind(this));

    /* events */
    $rootScope.$on('nextFlashcard', this.show.bind(this));
    $rootScope.$on('end', this.showStats.bind(this));

    keyboardManager.bind('space', function () {
      $scope.showAll();
    });
    keyboardManager.bind('right', function () {
      var flashcard = $scope.flashcards[$scope.session.index];
      $scope.session.addAnswer(flashcard, true);
    });
    keyboardManager.bind('left', function () {
      var flashcard = $scope.flashcards[$scope.session.index];
      $scope.session.addAnswer(flashcard, false);
    });

    $scope.$on('$destroy', function () {
      keyboardManager.unbind('space');
      keyboardManager.unbind('right');
      keyboardManager.unbind('left');
    });
  }

  DeckStudyController.prototype.show = function (index) {
    var scope = this.$scope;

    scope.visible.answerButtons = false;
    switch(scope.session.options.showFirst) {
      case scope.options.Sides.TERM:
        scope.visible.term = true;
        scope.visible.definition = false;
        break;
      case scope.options.Sides.DEFINITION:
        scope.visible.term = false;
        scope.visible.definition = true;
        break;
      case scope.options.Sides.RANDOM:
        if (Math.random() < 0.5) {
          scope.visible.term = true;
          scope.visible.definition = false;
        }
        else {
          scope.visible.term = false;
          scope.visible.definition = true;
        }
        break;
      case scope.options.Sides.BOTH:
        scope.visible.term = true;
        scope.visible.definition = true;
        scope.visible.answerButtons = true;
        break;
      default:
        console.log('scope.session.options.showFirst value cannot be handled: ' +
                   scope.session.options.showFirst);
      break;
    }
  };

  DeckStudyController.prototype.stringifyFlashcardOrder = function (orderId) {
    var opt = this.$scope.options;
    switch(orderId) {
      case opt.FlashcardOrders.CLASSIC:            return 'Classic';
      case opt.FlashcardOrders.HARDEST_TO_EASIEST: return 'Hardest to easiest';
      case opt.FlashcardOrders.LEAST_STUDIED:      return 'Least studied';
      case opt.FlashcardOrders.WRONGS:             return 'Wrongs';
      default:
        console.log('Unhandled order: ' + orderId);
    }
  };

  DeckStudyController.prototype.showAll = function () {
    var v = this.$scope.visible;
    v.term = true;
    v.definition = true;

    v.answerButtons = true;
  };

  DeckStudyController.prototype.showStats = function () {
    this.$scope.visible.stats = true;
  };

  angular.module('memorizy.deckstudy.DeckStudyController', [])
  .controller('DeckStudyController', [
    '$rootScope',
    '$scope',
    '$document',
    'SessionManager',
    'keyboardManager',
    DeckStudyController
  ]);

})();
