angular.module('memorizy.controllers')
.controller(
  'DeckEditorCtrl', 
  function ($scope, DeckEditorService, Flashcard, focus) {

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
      DeckEditorService.remove(id).success(function (data) {
        console.log('success : ', data);
      })
      .error(function (err) {
        console.log(err);
      });

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
      if (!Flashcard.equals(beforeEdit, displayed) && 
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
      beforeEdit = Flashcard.clone($scope.deck.flashcards[index]);

      // stop watching the previously displayed flashcard
      //if (typeof unregister === 'function') {
      //unregister();
      //}

      // track changes on the displayed flashcard
      //unregister = $scope.$watch('deck.flashcards[' + index + ']', 
      //function (newContent, oldContent) {

      //if (oldContent === newContent) { 
      //$scope.deck.active = index;
      //return;
      //}

      //var props = ['term_text', 'definition_text'];
      //oldContent.id = 2;

      //for (var i in props) {
      //var p = props[i];
      //if (newContent[p] !== oldContent[p]) {
      //if (typeof toSave[oldContent.id] === 'undefined') {
      //toSave[oldContent.id] = {};
      //}
      //toSave[oldContent.id][p] = newContent[p];
      //}
      //}
      //}, true);

      focus('term');
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

