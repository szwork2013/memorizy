(function () {
  'use strict';
  function DeckStudyController ($rootScope, $scope, $document, DeckStudyModel) {
    this.$scope = $scope;

    // $scope.deck is inherited from a parent scope
    
    // Split deck data and user's data for modularity
    var deck = {
      id: $scope.deck.id,
      name: $scope.deck.name,
      ownerId: $scope.deck.owner_id,
      ownerName: $scope.deck.owner_name,
      flashcards: $scope.deck.flashcards,
      size: $scope.deck.size 
    };
    var config = {
      order: $scope.deck.flashcard_order_id,
      showFirst: $scope.deck.show_first,
      starred: $scope.deck.starred,
      studied: $scope.deck.studied,
      method: $scope.deck.study_method,
      percentage: $scope.deck.percentage,
      restPercentage: $scope.deck.rest_percentage
    };

    DeckStudyModel.configure(deck, config);
    $scope.flashcards = DeckStudyModel.flashcards;
    $scope.session    = DeckStudyModel.session;
    $scope.options    = DeckStudyModel.session.options;
    $scope.stats      = DeckStudyModel.session.stats;

    $scope.visible = {
      term: false,
      definition: false,
      answerButtons: false,
      stats: false
    };

    $scope.showAll = this.showAll.bind(this);
    $scope.stringifyFlashcardOrder = this.stringifyFlashcardOrder.bind(this);

    /* watchers */
    $scope.$watch('session.index', this.show.bind(this));
    $scope.$watch('session.options.showFirst', function () {
      this.show(this.$scope.session.index);
    }.bind(this));

    /* events */
    $rootScope.$on('end', this.showStats.bind(this));

    $document.bind('keypress', function (event) {
      var key = event.which || event.keyCode || event.charCode;
      var flashcard = $scope.flashcards[$scope.session.index];
      switch (key) {
        case 32: // Space bar
          $scope.showAll();
        break;
        case 37: // Left arrow, wrong answer
          $scope.session.addAnswer(flashcard, false);
        break;
        case 39: // Right arrow, right answer
          $scope.session.addAnswer(flashcard, true);
        break;
        default:
          return;
      }

      if (!$scope.$$phase) { $scope.$apply(); }
			return false;
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
    'DeckStudyModel',
    DeckStudyController
  ]);

})();
