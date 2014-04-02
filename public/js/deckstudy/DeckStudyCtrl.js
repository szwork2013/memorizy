angular.module('memorizy.deckstudy.DeckStudyCtrl', [])
.controller(
  'DeckStudyCtrl', 
  function ($scope, $document, DeckStudy) {
    $scope.studyOpt = {
     showFirst: 'term'
    };

    $scope.visible = {
      term: false,
      definition: false,
      answerButtons: false,
      stats: false
    };

    $scope.display = function (index) {
      if (index >= $scope.deck.flashcards.length) {
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
            $scope.visible.answerButtons = true;
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

      var active = $scope.deck.active;

      stats.answered++;

      if (correct) {
        c.number++;
        c.flashcardIds.push(active);
      }
      else {
        w.number++;
        w.flashcardIds.push(active);
      }

      c.percentage = 100 * c.number / stats.answered;
      w.percentage = 100 * w.number / stats.answered;

      $scope.displayNext();
    };

    $scope.showStats = function () {
      $scope.visible.stats = true;
    };

    $scope.updateStats = function () {
      DeckStudy.updateStats($scope.stats);
    };

    //$rootScope.$on('end', function (event) {
      //$scope.showStats();
    //});

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

