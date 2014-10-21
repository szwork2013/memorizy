(function () { 
  'use strict'; 

  describe('register', function () {
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

    describe('register-model', function () {
      var registerModel, $rootScope, $localStorage;

      beforeEach(inject(['registerModel', function(rm) {
        registerModel = rm;
      }]));

      it('should send an event register:classic when registering using an email',
        function() {
          var data = {
            email:    'valid@email.fr',
            pseudo:   'validPseudo',
            password: 'validPassword'
          };
            
          registerModel.register(data.pseudo, data.email, data.password);

          sinon.assert.calledWith(socket.emit, 'register:classic', sinon.match(data));
        }
      );

      it('should throw when trying to register with an invalid email', function() {
          var data = {
            email:    'invalid email',
            pseudo:   'validPseudo',
            password: 'validPassword'
          };
            
          expect(function() {
            registerModel.register(data.pseudo, data.email, data.password);
          }).to.throw();
      });
      it('should throw when trying to register with an invalid pseudo', function() {
          var data = {
            email:    'valid@email.fr',
            pseudo:   '',
            password: 'validPassword'
          };
            
          expect(function() {
            registerModel.register(data.pseudo, data.email, data.password);
          }).to.throw();
      });
      it('should throw when trying to register with an invalid password', function() {
          var data = {
            email:    'valid@email.fr',
            pseudo:   'validPseudo',
            password: ''
          };
            
          expect(function() {
            registerModel.register(data.pseudo, data.email, data.password);
          }).to.throw();
      });
      it('should not send any event when data are invalid', function() {
          var valid = {
            email:    'valid@email.fr',
            pseudo:   'validPseudo',
            password: 'validPassword'
          };
          var invalid = {
            email:    'invalid email',
            pseudo:   '',
            password: ''
          };
        
          try { registerModel.register(invalid.pseudo, valid.email, valid.password); }
          catch (e) {}
          try { registerModel.register(valid.pseudo, invalid.email, valid.password); }
          catch (e) {}
          try { registerModel.register(valid.pseudo, valid.email, invalid.password); }
          catch (e) {}

          sinon.assert.notCalled(socket.emit);
      });

      // do something with registration cancelled by the server
    });
  });
})();
