var _ = require('lodash');
var assert = require('assert');
var feathers = require('feathers');

var hooks = require('../../hooks');

describe('.before hooks', function () {
  it('gets mixed into a service and modifies data', function (done) {
    var dummyService = {
      before: {
        create: function (data, params, callback) {
          data = _.extend({
            modified: 'data'
          }, data);

          params = _.extend({
            modified: 'params'
          }, params);

          callback(null, data, params);
        }
      },

      create: function (data, params, callback) {
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

    service.create({ some: 'thing' }, {}, function (error, data) {
      assert.ok(!error, 'No error');

      assert.deepEqual(data, {
        some: 'thing',
        modified: 'data'
      }, 'Data got modified');

      done();
    });
  });

  it('passes errors', function (done) {
    var dummyService = {
      before: {
        update: function (id, data, params, callback) {
          callback(new Error('You are not allowed to update'));
        }
      },

      update: function () {
        assert.ok(false, 'Never should be called');
      }
    };

    var app = feathers().configure(hooks()).use('/dummy', dummyService);
    var service = app.lookup('dummy');

    service.update(1, {}, {}, function (error) {
      assert.ok(error, 'Got an error');
      assert.equal(error.message, 'You are not allowed to update', 'Got error message')
      done();
    });
  });

  it('calling back with no arguments uses the old ones', function (done) {
    var dummyService = {
      before: {
        remove: function (id, params, callback) {
          callback();
        }
      },

      remove: function (id, params, callback) {
        assert.equal(id, 1, 'Got id');
        assert.deepEqual(params, { my: 'param' });
        callback();
      }
    };

    var app = feathers().configure(hooks()).use('/dummy', dummyService);
    var service = app.lookup('dummy');

    service.remove(1, { my: 'param' }, done);
  });
});
