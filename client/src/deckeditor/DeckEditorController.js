(function () {
  'use strict';
  function DeckEditorController ($scope, $sce, $timeout, DeckEditorModel, $upload,
                                 markdownConverter, flashcardService, cssInjector, 
                                 socketioUploader) 
  {

    cssInjector.add('/stylesheets/deck-editor.css');

    this.$scope = $scope;
    this.$sce = $sce;
    this.markdownConverter = markdownConverter;

    DeckEditorModel.init($scope.decks[0]);
    $scope.deck = DeckEditorModel.deck;
    $scope.decks = null;
    
    $scope.edit = {
      term: false,
      definition: false
    };

    $scope.markdownToHtml  = this.markdownToHtml.bind(this);
    $scope.addFlashcard    = DeckEditorModel.addFlashcard.bind(DeckEditorModel);
    $scope.removeFlashcard = DeckEditorModel.removeFlashcard.bind(DeckEditorModel);

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

        (function (displayed) {
          DeckEditorModel.saveFlashcard(displayed).
            success (function (flashcardId) {
              console.log('flashcardId = ' + flashcardId + ' (' + typeof flashcardId + ')');
              displayed.id = parseInt(flashcardId, 10);
            }).
            error(function (err) {
              console.log('error while saving: ', err); 
            });
        })(displayed);
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

    DeckEditorModel.init($scope.deck);
    $scope.display(0);
  }

  DeckEditorController.prototype.markdownToHtml = function (markdown) {
    // Remove Markdown rule for double space to insert a line break
    markdown = markdown ? markdown.replace(/\n/g, '  \n') : ''; 

    var html = this.markdownConverter.markdownToHtml(markdown);
    return this.$sce.trustAsHtml(html);
  };

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
