angular.module('memorizy.deckstudy.DeckStudyCtrl', [])
.controller(
  'DeckStudyCtrl', 
  function ($scope, $document, DeckStudyModel) {
    DeckStudyModel.init($scope.deck);

    $scope.studyOpt = DeckStudyModel.studyOpt;
    $scope.visible = DeckStudyModel.visible;
    $scope.stats = DeckStudyModel.stats;

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
      DeckStudyModel.show(DeckStudyModel.deck.active + 1);

      if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
        $scope.$apply();
      }
    };

    $scope.answer = function (correct) {
      var active = DeckStudyModel.deck.active;
      DeckStudyModel.answer(active.id, correct);
      if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
        $scope.$apply();
      }

      $scope.showNext();
    };

    $scope.studyOrders = [
      'Classic',
      'Hardest to easiest',
      'Least studied',
      'Wrongs'
    ];

    $scope.stringifyStudyOrder = function (studyOrderId) {
      return $scope.studyOrders[studyOrderId - 1];
    };

    $scope.setStudyOrder = function (studyOrderId) {
      DeckStudyModel.sort(studyOrderId);
    };

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

