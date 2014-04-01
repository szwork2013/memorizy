angular.module('memorizy.controllers')
.controller(
  'DeckStudyCtrl', 
  function ($scope, $document, DeckStudyService, Flashcard, focus) {
    $scope.studyOpt = {
     showFirst: 'term'
    };

    $scope.visible = {
      term: false,
      definition: false,
      answerButtons: false,
      stats: false
    };

    $scope.stats = {
      answered: 0,
      correct: {
        number: 0,
        percentage: 0
      },
      wrong: {
        number: 0,
        percentage: 0
      }
    };

    $scope.display = function (index) {
      if (index >= $scope.deck.flashcards.length) {
        console.log('stats: ', $scope.stats);
        $scope.showStats();
      }
      else {
        $scope.deck.active = index;
        $scope.visible.answerButtons = false;
        switch($scope.studyOpt.showFirst) {
          case 'term':
            $scope.visible.term = true;
            $scope.visible.definition = false;
            break;
          case 'definition':
            $scope.visible.term = false;
            $scope.visible.definition = true;
            break;
          case 'random':
            if (Math.random() < 0.5) {
              $scope.visible.term = true;
              $scope.visible.definition = false;
            }
            else {
              $scope.visible.term = false;
              $scope.visible.definition = true;
            }
            break;
          case 'both':
            $scope.visible.term = true;
            $scope.visible.definition = true;
            break;
          default:
            console.log('$scope.studyOpt.visible.First value cannot be handled');
            break;
        }
      }

      if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
        $scope.$apply();
      }
    };

    $scope.displayAll = function () {
      $scope.visible.term = true;
      $scope.visible.definition = true;

      $scope.visible.answerButtons = true;

      if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
        $scope.$apply();
      }
    };

    $scope.displayNext = function () {
      $scope.display($scope.deck.active + 1);
    };

    $scope.answer = function (correct) {
      var stats = $scope.stats,
          c = stats.correct,
          w = stats.wrong;

      stats.answered++;

      if (correct) {
        c.number++;
      }
      else {
        w.number++;
      }

      c.percentage = 100 * c.number / stats.answered;
      w.percentage = 100 * w.number / stats.answered;

      $scope.displayNext();
    };

    $scope.showStats = function () {
      $scope.visible.stats = true;
    };

    $document.bind('keypress', function (event) {
      var key = event.which || event.keyCode || event.charCode;
      switch (key) {
        case 32: // Space bar
          $scope.displayAll();
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

    $scope.display(0);
  });

