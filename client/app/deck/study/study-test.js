(function () { 
  'use strict'; 

  describe('deckStudy', function () {
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

    describe('studysession-model', function () {
      var session;

      beforeEach(inject(['studySessionModel', function(ssm) {
          session = ssm;
      }]));

      describe('Configuration', function() {
        describe('Attach to a deck', function() {
          it('should set property \'deck\'', function() {
            var deck = { id: 123, flashcards: []},
                s = session.create(deck);

            assert.deepEqual(s.deck, {
              id: deck.id,
              flashcards: deck.flashcards
            });
          });

          it('should set study method', function() {
            var deck = { study_method: {} },
                s = session.create(deck);

            expect(s.config.method).to.equal(deck.study_method);
          });

          it('should set flashcard order', function() {
            var deck = { flashcard_order_id: {} }, 
                s = session.create(deck);

            expect(s.config.order).to.equal(deck.flashcard_order_id);
          });

          it('should set first side to show', function() {
            var deck = { show_first: {} }, 
                s = session.create(deck);

            expect(s.config.showFirst).to.equal(deck.show_first);
          });

          it('should create session in local storage');
        });

        describe('Set study method', function() {
          it('should update method', function() {
            var deck = {}, method = {},
                s = session.create(deck);

            s.setMethod(method);
            expect(s.config.method).to.equal(method); 
          });

          it('should send an event deck:studyMethod', function() {
            var deck = { id: 123 }, method = 'method',
                s = session.create(deck);

            s.setMethod(method);
            sinon.assert.calledWith(socket.emit, 'deck:studyMethod', sinon.match({
              id: deck.id,
              method: method
            }));
          });

          it('should create a subdeck when switching to method get100');
            //var deck = { id: 123 }, 
                //s = session.create(deck);

            //s.setMethod(s.config.Methods.GET100);
            //assert.deepEqual(s.subdeck, {
              //index: 0
            //});
          //});
        });

        describe('Set flashcard order', function() {
          it('should update flashcard order', function() {
            var deck = {}, order = {},
                s = session.create(deck);

            s.setFlashcardOrder(order);
            expect(s.config.order).to.equal(order); 
          });

          it('should send an event deck:flashcardOrder', function() {
            var deck = { id: 123 }, flashcardOrder = 'flashcardOrder',
                s = session.create(deck);

            s.setFlashcardOrder(flashcardOrder);
            sinon.assert.calledWith(socket.emit, 'deck:flashcardOrder', sinon.match({
              id: deck.id,
              flashcardOrder: flashcardOrder
            }));
          });
        });

        describe('Set first side to show', function() {
          it('should update first side to show', function() {
            var deck = {}, showFirst = {},
                s = session.create(deck);

            s.setShowFirst(showFirst);
            expect(s.config.showFirst).to.equal(showFirst); 
          });

          it('should send an event deck:showFirst', function() {
            var deck = {}, showFirst = {},
                s = session.create(deck);

            s.setShowFirst(showFirst);
            sinon.assert.calledWith(socket.emit, 'deck:showFirst', sinon.match({
              id:        deck.id,
              showFirst: showFirst
            }));
          });
        });

      });

      describe('Answer', function() {
        it('should update answer list', function() {
          var deck = {
            flashcards: [
              { id: 1 },
              { id: 2 },
              { id: 3 }
            ]
          };
          var s = session.create(deck);  
        });
        it('should emit an internal event session:end on last answer');
      });
      describe('Session config', function() {});
      describe('Multiple session', function() {});
      describe('End session', function() {});

    });
  });
})();


