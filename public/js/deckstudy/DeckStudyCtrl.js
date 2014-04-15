angular.module('memorizy.deckstudy.DeckStudyCtrl', [])
.controller(
  'DeckStudyCtrl', 
  function ($scope, $document, DeckStudyModel) {
    DeckStudyModel.init($scope.deck);

    $scope.session = DeckStudyModel.session;
    $scope.visible = DeckStudyModel.visible;

    $scope.show = function (index) {
      DeckStudyModel.show(index);

      if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
        $scope.$apply();
      }
    };

    $scope.showAll = function () {
      DeckStudyModel.showAll();

      if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
        $scope.$apply();
      }
    };

    $scope.showNext = function () {
      DeckStudyModel.show(DeckStudyModel.session.index + 1);

      if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
        $scope.$apply();
      }
    };

    $scope.answer = function (correct) {
      var active = DeckStudyModel.session.index;
      DeckStudyModel.answer(active.id, correct);
      if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
        $scope.$apply();
      }

      $scope.showNext();
    };

    $scope.flashcardOrders = [
      'Classic',
      'Hardest to easiest',
      'Least studied',
      'Wrongs'
    ];

    $scope.stringifyFlashcardOrder = function (flashcardOrderId) {
      return $scope.flashcardOrders[flashcardOrderId - 1];
    };

    $scope.setFlashcardOrder = function (flashcardOrderId) {
      DeckStudyModel.sort(flashcardOrderId);
    };

    $scope.showFirst = function (side) {
      DeckStudyModel.showFirst(side);
    };

    $scope.StudyMethods = DeckStudyModel.StudyMethods;
    $scope.updateStudyMethod = function (method) {
      DeckStudyModel.updateStudyMethod(method);
    };

    $scope.$watch('session.options.method', function (newVal, oldVal) {
      $scope.updateStudyMethod(newVal);
    });

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

    $scope.show(0);
  });

