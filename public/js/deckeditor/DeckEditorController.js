(function () {
  'use strict';
  function DeckEditorController ($scope, $sce, $timeout, DeckEditorModel, $upload,
                                 markdownConverter, flashcardService, cssInjector, 
                                 socketioUploader) 
  {

    cssInjector.add('/stylesheets/deck-editor.css');

    $scope.deck = $scope.decks[0];
    $scope.decks = null;
    
    $scope.edit = {
      term: false,
      definition: false
    };

    $scope.markdown = {
      term: null,
      definition: null
    };

    $scope.markdownToHtml  = markdownConverter.markdownToHtml;
    $scope.addFlashcard    = DeckEditorModel.addFlashcard;
    $scope.removeFlashcard = DeckEditorModel.removeFlashcard;
    $scope.trustAsHtml     = $sce.trustAsHtml;

    /* Watchers */
    $scope.$watch('markdown.term', function (n, o) {
      if (n === o) { return; }
      $scope.deck.flashcards[$scope.deck.active].term_text = 
        $scope.markdownToHtml(n);
    });
    $scope.$watch('markdown.definition', function (n, o) {
      if (n === o) { return; }
      $scope.deck.flashcards[$scope.deck.active].definition_text = 
        $scope.markdownToHtml(n);
    });

    $scope.onFileSelect = function(files) {
      socketioUploader.upload(files[0]);
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

      var activeFlashcard = $scope.deck.flashcards[index];
      $scope.markdown.term = markdownConverter.htmlToMarkdown(activeFlashcard.term_text);
      $scope.markdown.definition = markdownConverter.htmlToMarkdown(activeFlashcard.definition_text);


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

    DeckEditorModel.init($scope.deck);
    $scope.display(0);
  }

  angular.module('memorizy.deckeditor.DeckEditorController', [])
  .controller('DeckEditorController', [
    '$scope',
    '$sce',
    '$timeout',
    'DeckEditorModel',
    '$upload',
    'markdownConverter',
    'flashcardService',
    'cssInjector',
    'socketioUploader',
    DeckEditorController
  ]);
})();
