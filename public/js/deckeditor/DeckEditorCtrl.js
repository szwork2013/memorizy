angular.module('memorizy.deckeditor.DeckEditorCtrl', [])
.controller(
  'DeckEditorCtrl', 
  function ($scope, DeckEditorService, flashcardService, focusService) {

    $scope.addFlashcard = function () {
      $scope.deck.flashcards.push({
        deck_id: $scope.deck.id,
        term_text: 'coucou',
        definition_text: 'fez'
      });
    };

    $scope.updateFlashcard = function () {

    };

    $scope.removeFlashcard = function (id) {

    }; 
    $scope.moveFlashcard = function () {

    };

    $scope.showUploadForm = function (side) {

    };

    $scope.hideUploadForm = function (side) {

    };

    $scope.upload = function (side) {

    };

    $scope.removeMedia = function (side) {

    };

    //var toSave = {};
    //var unregister;

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

        DeckEditorService.save(displayed).success(function (data) {
          console.log('successfuly saved: ', data);      
        })
        .error(function (err) {
          console.log('error while saving: ', err); 
        });
      }

      $scope.deck.active = index;

      // clone the flashcard before it is edited, so that we can
      // know if it has been modified when we display
      // another flashcard
      beforeEdit = flashcardService.clone($scope.deck.flashcards[index]);

      focusService.focus('term');
    };

    $scope.focusTerm = function () {
      focus('term');
    };

    $scope.focusDefinition = function () {
      focus('definition');
    };

    function save (flashcard) {
      return DeckEditorService.save(flashcard); 
    }

    if ($scope.deck.flashcards.length <= 0) {
      $scope.addFlashcard();
    }

    $scope.display(0);

    // TEST

    console.log('flashcards: ', $scope.deck.flashcards);
  });

