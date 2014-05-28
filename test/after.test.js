var _ = require('lodash');
var assert = require('assert');
var feathers = require('feathers');

var hooks = require('../lib/hooks');

describe('.after hooks', function () {
  it('gets mixed into a service and modifies data', function (done) {
    var dummyService = {
      after: {
        create: function (result, data, params, callback) {
          callback(null, _.extend({ some: 'thing' }, result));
        }
      },

      create: function (data, params, callback) {
        callback(null, data);
      }
    };

    var app = feathers().configure(hooks()).use('/dummy', dummyService);
    var service = app.lookup('dummy');

    service.create({ my: 'data' }, {}, function(error, data) {
      assert.deepEqual({ my: 'data', some: 'thing' }, data, 'Got modified data');
      done();
    });
  });

  it('returns errors', function (done) {
    var dummyService = {
      after: {
        update: function (result, id, data, params, callback) {
          callback(new Error('This did not work'));
        }
      },

      update: function (id, data, params, callback) {
        callback(null, data);
      }
    };

    var app = feathers().configure(hooks()).use('/dummy', dummyService);
    var service = app.lookup('dummy');

    service.update(1, { my: 'data' }, {}, function(error) {
      assert.ok(error, 'Got an error');
      assert.equal(error.message, 'This did not work', 'Got expected error message from hook');
      done();
    });
  });

  it('does not run after hook when there is an error', function (done) {
    var dummyService = {
      after: {
        remove: function () {
          assert.ok(false, 'This should never get called');
        }
      },

      remove: function (id, params, callback) {
        callback(new Error('Error removing item'));
      }
    };

    var app = feathers().configure(hooks()).use('/dummy', dummyService);
    var service = app.lookup('dummy');

    service.remove(1, {}, function(error) {
      assert.ok(error, 'Got error');
      assert.equal(error.message, 'Error removing item', 'Got error message from service');
      done();
    });
  });

  it('adds .after() and chains multiple calls', function (done) {
    var dummyService = {
      create: function (data, params, callback) {
        callback(null, data);
      }
    };

    var app = feathers().configure(hooks()).use('/dummy', dummyService);
    var service = app.lookup('dummy');

    service.after({
      create: function (result, data, params, callback) {
        callback(null, _.extend({ some: 'thing' }, result));
      }
    });

    service.after({
      create: function (result, data, params, callback) {
        callback(null, _.extend({ other: 'stuff' }, result));
      }
    });

    service.create({ my: 'data' }, {}, function(error, data) {
      assert.deepEqual({
        my: 'data',
        some: 'thing',
        other: 'stuff'
      }, data, 'Got modified data');
      done();
    });
  });
});
