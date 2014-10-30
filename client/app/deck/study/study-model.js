(function () {
  'use strict';

  /**
   * SessionManager handles one or several study sessions
   *
   * @constructor
   * @param $rootScope
   */
  function SessionManager ($rootScope, $http, $location) {

    this.$rootScope = $rootScope;
    this.$http      = $http;
    this.$location  = $location;

    /**
     * There is one session per deck to study
     */
    this.sessions = [];

    /**
     * Index of the active session in 'sessions' property
     */
    this.activeSessionIdx = -1;

    var self = this;

    $rootScope.$on('sessionEnd', function (e, sessionIdx) {
      self.next();
    });

    // Group status from every session before sending
    // them to the server
    $rootScope.$on('end', function () {
      var status = {};
      for (var i in this.sessions) {
        var s = this.sessions[i].status;
        for (var j in s) {
          if (s.hasOwnProperty(j)) {
            status[j] = s[j];
          }
        }
      }

      return this.$http.put('/api' + this.$location.path(), status, {
        params: { action: 'updateStatus' }
      });
    }.bind(this));
  }

  SessionManager.prototype = {

    /**
     * Create a new session for each deck in decks
     * @param {Array<Object>} decks
     */
    configure: function (decks) {
      this.reset();

      for (var i in decks) {
        // TODO: Break dependency injection paradigm, should not pass 
        // $rootScope, $http, $location as argument
        this.sessions.push(new Session(
          this.$rootScope, this.$http, this.$location, decks[i]));
      }
      this.activeSessionIdx = 0;
    },

    /**
     * Go to the next session which is not completed yet,
     * if there is no incomplete session after the active one,
     * it looks at the sessions before it
     */
    next: function () {
      var found = false,
          iterations = 0,
          idx, session;

      // TODO Make a faster algorithm to find the next session
      while (!found && (iterations + 1) < this.sessions.length) {
        iterations++;
        idx = (this.activeSessionIdx + iterations) % this.sessions.length;
        session = this.sessions[idx];

        if (!session.complete) { found = true; }
      }

      if (found) { console.log('set idx to ' + idx); this.activeSessionIdx = idx; }
      else { this.$rootScope.$emit('end'); } // No more deck to study
    },

    /**
     * Reset properties to their default values
     */
    reset: function () {
      this.sessions = [];
      this.activeSessionIdx = -1;
    }

  };

  angular.module('memorizy.deckstudy.StudySessionManager', []). 
    provider('StudySessionManager', function () {
    this.$get = [
      '$rootScope',
      '$http',
      '$location',
      function ($rootScope, $http, $location) {
        return new SessionManager($rootScope, $http, $location);
      }
    ];
  });
})();
