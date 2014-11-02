(function() {
  'use strict';

  var q             = require('q');
  var registerModel = require('../models/register');
  var userModel     = require('../models/user');
  var db = require('../models/db');

  db.conn = 'postgres://postgres:postgres@' + process.env.DB_PORT_5432_TCP_ADDR + 
            ':5432/memorizy';

  describe('Scenario', function() {
    it('should register two users', function(done) {
      var promises = [];

      promises.push(registerModel.createUser({
        name:     'user3',
        email:    'user3@memorizy.com',
        password: 'user1password'
      }));

      promises.push(registerModel.createUser({
        name:     'user2',
        email:    'user2@memorizy.com',
        password: 'user2password'
      }));

      q.all(promises).then(function () { done(); }).catch(done); 
    });

    it('should not allow file creation to a disabled account');
    it('should enable account and create a root folder for the user');
    it('should create a new folder');
    it('should create a new deck');
    it('should allow user1 to open his files');
    it('should not allow user1 to create a file in user2\'s folder'); 
    it('should not allow user1 to open a file in user2\'s folder'); 
    it('should not allow user1 to copy a file to user2\'s folder');
    it('should not allow user1 to move a file to user2\'s folder');
    it('should not allow user2 to delete user1\'s files');
  });
})();
