angular.module('memorizy.controllers')
.controller(
  'DeckStudyCtrl', 
  function ($scope, $document, DeckStudyService, Flashcard, focus) {
    $scope.studyOpt = {
      showFirst: 'term'
    };

    $scope.showTerm = false;
    $scope.showDefinition = false;

    $scope.display = function (index) {
      $scope.deck.active = index;
      switch($scope.studyOpt.showFirst) {
        case 'term':
          $scope.showTerm = true;
          break;
        case 'definition':
          $scope.showDefinition = true;
          break;
        case 'random':
          if (Math.random() < 0.5) {
            $scope.showTerm = true;
          }
          else {
            $scope.showDefintion = true;
          }
          break;
        case 'both':
          $scope.showTerm = true;
          $scope.showDefinition = true;
          break;
        default:
          console.log('$scope.studyOpt.showFirst value cannot be handled');
          break;
      }
    };

    $scope.displayAll = function () {
      $scope.$apply(function () {
        $scope.showTerm = true;
        $scope.showDefinition = true;

        $scope.showAnswerButtons = true;
      });
    };

    $document.bind('keypress', function (event) {
      if (event.which === 32) { // Space bar
        $scope.displayAll();
      }
    });

    $scope.display(0);
  });

