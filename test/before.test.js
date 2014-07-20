var _ = require('lodash');
var Q = require('q');
var assert = require('assert');
var feathers = require('feathers');

var hooks = require('../lib/hooks');

describe('.before hooks', function() {
  it('gets mixed into a service and modifies data', function(done) {
    var dummyService = {
      before: {
        create: function(hook, next) {
          assert.equal(hook.type, 'before');

          hook.data.modified = 'data';

          _.extend(hook.params, {
            modified: 'params'
          });

          next(null, hook);
        }
      },

      create: function(data, params, callback) {
        assert.deepEqual(data, {
          some: 'thing',
          modified: 'data'
        }, 'Data modified');

        assert.deepEqual(params, {
          modified: 'params'
        }, 'Params modified');

        callback(null, data);
      }
    };

    var app = feathers().configure(hooks()).use('/dummy', dummyService);
    var service = app.lookup('dummy');

    service.create({ some: 'thing' }, {}, function(error, data) {
      assert.ok(!error, 'No error');

      assert.deepEqual(data, {
        some: 'thing',
        modified: 'data'
      }, 'Data got modified');

      done();
    });
  });

  it('passes errors', function(done) {
    var dummyService = {
      before: {
        update: function(hook, next) {
          next(new Error('You are not allowed to update'));
        }
      },

      update: function() {
        assert.ok(false, 'Never should be called');
      }
    };

    var app = feathers().configure(hooks()).use('/dummy', dummyService);
    var service = app.lookup('dummy');

    service.update(1, {}, {}, function(error) {
      assert.ok(error, 'Got an error');
      assert.equal(error.message, 'You are not allowed to update', 'Got error message');
      done();
    });
  });

  it('calling back with no arguments uses the old ones', function(done) {
    var dummyService = {
      before: {
        remove: function(hook, next) {
          next();
        }
      },

      remove: function(id, params, callback) {
        assert.equal(id, 1, 'Got id');
        assert.deepEqual(params, { my: 'param' });
        callback();
      }
    };

    var app = feathers().configure(hooks()).use('/dummy', dummyService);
    var service = app.lookup('dummy');

    service.remove(1, { my: 'param' }, done);
  });

  it('adds .before() and chains multiple hooks for the same method', function(done) {
    var dummyService = {
      create: function(data, params, callback) {
        assert.deepEqual(data, {
          some: 'thing',
          modified: 'second data'
        }, 'Data modified');

        assert.deepEqual(params, {
          modified: 'params'
        }, 'Params modified');

        callback(null, data);
      }
    };

    var app = feathers().configure(hooks()).use('/dummy', dummyService);
    var service = app.lookup('dummy');

    service.before({
      create: function(hook, next) {
        hook.params.modified = 'params';

        next();
      }
    });

    service.before({
      create: function(hook, next) {
        hook.data.modified = 'second data';

        next();
      }
    });

    service.create({ some: 'thing' }, {}, function(error) {
      assert.ok(!error, 'No error');
      done();
    });
  });

  it('chains multiple after hooks using array syntax', function(done) {
    var dummyService = {
      create: function(data, params, callback) {
        assert.deepEqual(data, {
          some: 'thing',
          modified: 'second data'
        }, 'Data modified');

        assert.deepEqual(params, {
          modified: 'params'
        }, 'Params modified');

        callback(null, data);
      }
    };

    var app = feathers().configure(hooks()).use('/dummy', dummyService);
    var service = app.lookup('dummy');

    service.before({
      create: [
        function(hook, next) {
          hook.params.modified = 'params';

          next();
        },
        function(hook, next) {
          hook.data.modified = 'second data';

          next();
        }
      ]
    });

    service.create({ some: 'thing' }, {}, function(error) {
      assert.ok(!error, 'No error');
      done();
    });
  });

  it('.before hooks can return a promise', function(done) {
    var app = feathers().configure(hooks()).use('/dummy', {
      get: function(id, params) {
        assert.ok(params.ran, 'Ran through promise hook');

        return Q({
          id: id,
          description: 'You have to do ' + id
        });
      },

      remove: function() {
        assert.ok(false, 'Should never get here');
      }
    });

    var service = app.lookup('dummy').before({
      get: function(hook) {
        var dfd = Q.defer();

        setTimeout(function() {
          hook.params.ran = true;
          dfd.resolve();
        }, 50);

        return dfd.promise;
      },

      remove: function() {
        var dfd = Q.defer();

        setTimeout(function() {
          dfd.reject(new Error('This did not work'));
        }, 50);

        return dfd.promise;
      }
    });

    service.get('dishes', {}, function() {
      service.remove(10, {}, function(error) {
        assert.equal(error.message, 'This did not work');
        done();
      });
    });
  });
});
