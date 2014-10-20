(function () { 
  'use strict'; 

  describe('login', function () {
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

    describe('login-model', function () {
      var loginModel, $rootScope, $localStorage;

      beforeEach(inject([
        'LoginModel', '$rootScope', '$localStorage', 
        function(lm, rs, ls) {
          loginModel = lm;
          $rootScope    = rs;
          $localStorage = ls;
        }
      ]));

      describe('login', function() {
        it('should send an event login:classic when login using an email/pseudo', function() {
          var login    = 'valid@email.fr',
              password = 'somepassword';

          loginModel.login(login, password);

          sinon.assert.calledWith(socket.emit, 'login:classic', sinon.match({
            login:    login,
            password: password
          }));
        });

        it('should store user information in rootScope and local storage on login:loggedIn', function() {
          var data = {
            user: { abc: 'abc' },
            token: 'supertoken'
          };

          socket.fire('login:loggedIn', data);  
          expect($rootScope.user).to.equal(data.user);
          expect($localStorage.user).to.equal(data.user);
          expect($localStorage.token).to.equal(data.token);
        });

        it('should throw when trying to login with an empty email/pseudo', function() {
          expect(function() {
            loginModel.login('', 'somepassword');
          }).to.throw();
        });

        it('should throw when trying to login with an empty password', function() {
          expect(function() {
            loginModel.login('valid@email.fr', '');
          }).to.throw();
        });

        it('should not send any event when login or password are empty', function() {
          try { loginModel.login('valid@email.fr', ''); } catch(e) {}
          try { loginModel.login('', 'somepassword'); } catch(e) {}

          sinon.assert.notCalled(socket.emit);
        });
      });

      describe('logout', function() {
        it('should remove user information from rootScope and local storage on login:loggedOut', function () {
          var data = {
            user: { abc: 'abc' },
            token: 'supertoken'
          };

          $rootScope.user     = data.user;
          $localStorage.user  = data.user;
          $localStorage.token = data.token;

          socket.fire('login:loggedOut', data);  

          expect($rootScope.user).to.equal(null);
          expect($localStorage.user).to.equal(null);
          expect($localStorage.token).to.equal(null);
        });
      });
    });
  });
})();
