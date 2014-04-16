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
  
  $scope.session = DeckStudyModel.session;

  var options = $scope.session.options;

  $scope.FlashcardOrders = options.FlashcardOrders;
  $scope.Sides           = options.Sides;
  $scope.Methods         = options.Methods;

  $scope.visible = {
    term: false,
    definition: false,
    answerButtons: false,
    stats: false
  };

  /* methods available to the view */
  $scope.updateFlashcardOrder = options.updateFlashcardOrder.bind(options);
  $scope.updateShowFirst      = options.updateShowFirst.bind(options);
  $scope.updateMethod         = options.updateMethod.bind(options);
  $scope.answer               = DeckStudyModel.answer;

  $scope.showAll = this.showAll;
  $scope.stringifyFlashcardOrder = this.stringifyFlashcardOrder;

  /* watchers */
  $scope.$watch('session.index', this.show.bind(this));

  /* events */
  $rootScope.$on('end', this.showStats.bind(this));

  $document.bind('keypress', function (event) {
    var key = event.which || event.keyCode || event.charCode;
    switch (key) {
      case 32: // Space bar
        $scope.showAll();
      break;
      case 37: // Left arrow, wrong answer
        $scope.answer(false);
      break;
      case 39: // Right arrow, right answer
        $scope.answer(true);
      break;
      default:
        break;
    }
  });
}

DeckStudyController.prototype.show = function (index) {
  var scope = this.$scope;

  scope.visible.answerButtons = false;
  switch(scope.session.options.showFirst) {
    case scope.Sides.TERM:
      scope.visible.term = true;
      scope.visible.definition = false;
      break;
    case scope.Sides.DEFINITION:
      scope.visible.term = false;
      scope.visible.definition = true;
      break;
    case scope.Sides.RANDOM:
      if (Math.random() < 0.5) {
        scope.visible.term = true;
        scope.visible.definition = false;
      }
      else {
        scope.visible.term = false;
        scope.visible.definition = true;
      }
      break;
    case scope.Sides.BOTH:
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
  switch(orderId) {
    case this.FlashcardOrders.CLASSIC:            return 'Classic';
    case this.FlashcardOrders.HARDEST_TO_EASIEST: return 'Hardest to easiest';
    case this.FlashcardOrders.LEAST_STUDIED:      return 'Least studied';
    case this.FlashcardOrders.WRONGS:             return 'Wrongs';
    default:
      console.log('Unhandled method: ' + orderId);
  }
};

DeckStudyController.prototype.showAll = function () {
  this.visible.term = true;
  this.visible.definition = true;

  this.visible.answerButtons = true;
};

DeckStudyController.prototype.showStats = function () {
  this.visible.stats = true;
};

angular.module('memorizy.deckstudy.DeckStudyController', [])
.controller('DeckStudyController', [
  '$rootScope',
  '$scope',
  '$document',
  'DeckStudyModel',
  DeckStudyController
]);

