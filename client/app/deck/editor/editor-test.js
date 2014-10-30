(function () { 
  'use strict'; 

  describe('deckEditor', function () {
    var socket, location,
        sandbox  = sinon.sandbox.create();

    beforeEach(function () {
      module('memorizy');

      inject(function (socketio, $location) {
        socket       = socketio;
        location     = $location;
      });

      sandbox.stub(socket, 'emit', function() {});
      sandbox.stub(socket, 'on', function(event, cb) {
        this.listeners = this.listeners || {};
        this.listeners[event] = this.listeners.event || [];

        this.listeners[event].push(cb);
      });
      socket.fire = function (event, data) {
        if (!this.listeners || !this.listeners[event]) { return; }
        this.listeners[event].forEach(function(cb) {
          cb(data);
        });
      };

      sandbox.stub(location, 'path', function() {
        return 'here';
      });
    });

    afterEach(function() {
      sandbox.restore();
    });

    describe('editor-model', function () {
      var editorModel;

      beforeEach(inject(['deckEditorModel', function(em) {
          editorModel = em;
      }]));

      describe('Add a flashcard', function () {
        it('should push the flashcard at the end of the list', function() {
          var flashcards = ['f1', 'f2'];

          editorModel.init({
            flashcards: flashcards
          });

          var f = editorModel.addFlashcard();
          expect(flashcards.length).to.equal(3);
          expect(flashcards[flashcards.length - 1]).to.equal(f);
        });
      });
      describe('Remove a flashcard', function () {
        it('should emit an event flashcard:remove', function() {
          editorModel.deck = {
            flashcards: [
              { id: 1234 },
              { id: 123 },
              { id: 12 }
            ]
          };

          editorModel.removeFlashcard(1);
          sinon.assert.calledWith(socket.emit, 'flashcard:remove', sinon.match({ id: 123 }));
        });
        it('should update flashcard list on flashcard:removed', function() {
          editorModel.deck = {
            flashcards: [
              { id: 1234 },
              { id: 123 },
              { id: 12 }
            ]
          };

          socket.fire('flashcard:removed', { id: 123 });
          expect(editorModel.deck.flashcards.length).to.equal(2);
          expect(editorModel.deck.flashcards[1].id).to.equal(12);
        });
        it('should not emit an event to the server if the flashcards has never been saved', function() {
          editorModel.deck = {
            flashcards: [
              { id: 1234 },
              { doesNotHave: 'any id' },
              { id: 12 }
            ]
          };

          editorModel.removeFlashcard(1);
          sinon.assert.notCalled(socket.emit);
        });
        it('should update flashcard list instantly if the removed flashcard does not have an id', function() {
          editorModel.deck = {
            flashcards: [
              { id: 1234 },
              { doesNotHave: 'any id' },
              { id: 12 }
            ]
          };

          editorModel.removeFlashcard(1);
          expect(editorModel.deck.flashcards.length).to.equal(2);
          expect(editorModel.deck.flashcards[1].id).to.equal(12);
        });

        it('should add a new flashcard if the deck is empty once the flashcard has been removed', function() {
          editorModel.deck = {
            flashcards: [
              { id: 1234 },
            ]
          };

          sandbox.spy(editorModel, 'addFlashcard');
          socket.fire('flashcard:removed', { id: 1234 });
          sinon.assert.called(editorModel.addFlashcard);
        });
      });
      describe('Save a flashcard', function () {
        it('should emit an event flashcard:save', function() {
          var flashcard = {};

          editorModel.deck = { flashcards: [] };
          editorModel.saveFlashcard(flashcard);
          sinon.assert.calledWith(socket.emit, 'flashcard:save', {
            flashcard: flashcard,
            queryId: 0
          });
        });

        it('should push the flashcard into the query queue if it has no id', function() {
          editorModel.deck = { flashcards: [] };
          var flashcardWithoutId = {};
          editorModel.saveFlashcard(flashcardWithoutId);

          expect(editorModel.deck.queryForId[0]).to.equal(flashcardWithoutId);
        });

        it('should update flashcard id on flashcard:saved', function() {
          var flashcardWithoutId = {};

          editorModel.deck = {
            flashcards: [
              { id: 1 },
              flashcardWithoutId,
              { id: 2 }
            ]
          };

          editorModel.deck.queryForId = [ flashcardWithoutId ];

          socket.fire('flashcard:saved', {
            queryId: 0,
            id:      123
          });

          expect(editorModel.deck.flashcards[1].id).to.equal(123); 
        });
        it('should throw when a flashcard side is more than XXX characters');
      });

      describe('Move a flashcard', function () {
        it('should emit an event flashcard:move', function() {
          editorModel.deck = {
            flashcards: [
              { id: 1 },
              { id: 2 },
              { id: 3 },
            ]
          };
          editorModel.moveFlashcard(1, 2);
          sinon.assert.calledWith(socket.emit, 'flashcard:move', sinon.match({
            id: 2,
            newPosition: 2
          }));
        });

        it('should update deck directly if the flashcard has no id', function() {
          editorModel.deck = {
            flashcards: [
              { id: 1 },
              { id: 12 },
              { noId: '' },
            ]
          };
          editorModel.moveFlashcard(2, 1);
          sinon.assert.notCalled(socket.emit);

          expect(editorModel.deck.flashcards.length).to.equal(3);
          assert.deepEqual(editorModel.deck.flashcards[1], { noId: '' }); 
        });

        it('should update flashcard list on flashcard:moved', function() {
          editorModel.deck = {
            flashcards: [
              { id: 1 },
              { id: 2 },
              { id: 3 },
            ]
          };
          socket.fire('flashcard:moved', {
            id: 2,
            newPosition: 0
          });

          expect(editorModel.deck.flashcards.length).to.equal(3);
          assert.deepEqual(editorModel.deck.flashcards[0], { id: 2 }); 
        });
        it('should throw when moving a flashcard to an incorrect position');
      });
      describe('Upload an image', function () {
        it('should emit an event flashcard:uploadImage');
        it('should update flashcard on event flashcard:imageUploaded');
      });
    });
  });
})();

