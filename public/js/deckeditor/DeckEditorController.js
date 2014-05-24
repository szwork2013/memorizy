(function () {
  'use strict';
  function DeckEditorController ($scope, $sce, $timeout, DeckEditorModel, markdownConverter, flashcardService) {
    $scope.deck = $scope.decks[0];
    $scope.decks = null;

    $scope.edit = {
      term: false,
      definition: false
    };

    $scope.markdownToHtml = function (str) {
      return $sce.trustAsHtml(markdownConverter.makeHtml(str));
    };

    DeckEditorModel.init($scope.deck);

    $scope.addFlashcard = function () {
      DeckEditorModel.addFlashcard();
    };

    $scope.removeFlashcard = function (index) {
      DeckEditorModel.removeFlashcard(index);
    }; 

    var beforeEdit;
    $scope.display = function (index) {
      var displayed = $scope.deck.flashcards[$scope.deck.active];

      if (index < 0) {
        index = 0;
      }

      // add a flashcard if we reach the end of the deck 
      if (index >= $scope.deck.flashcards.length) {
        index = $scope.deck.flashcards.length;
        $scope.addFlashcard();  
      }

      // send updates to the server, if any
      if (!flashcardService.equals(beforeEdit, displayed) && 
          typeof beforeEdit !== 'undefined') {

        DeckEditorModel.saveFlashcard(displayed).
          error(function (err) {
            console.log('error while saving: ', err); 
          });
      }

      $scope.deck.active = index;

      // clone the flashcard before it is edited, so that we can
      // know if it has been modified when we display
      // another flashcard
      beforeEdit = flashcardService.clone($scope.deck.flashcards[index]);

      $scope.editTerm();
    };

    $scope.editTerm = function () {
      $timeout(function () {
        $scope.edit.term = true;
      });
      $timeout(function () {
        $('#term-input').focus();
      });
    };

    $scope.editDefinition = function () {
      $timeout(function () {
        $scope.edit.definition = true;
      });
      $timeout(function () {
        $('#definition-input').focus();
      });
    };

    if ($scope.deck.flashcards.length <= 0) {
      $scope.addFlashcard();
    }

    $scope.display(0);
  }

  angular.module('memorizy.deckeditor.DeckEditorController', [])
  .controller('DeckEditorController', [
    '$scope',
    '$sce',
    '$timeout',
    'DeckEditorModel',
    'markdownConverter',
    'flashcardService',
    DeckEditorController
  ]);
})();
