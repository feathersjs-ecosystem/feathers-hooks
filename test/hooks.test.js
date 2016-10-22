import assert from 'assert';
import feathers from 'feathers';

import hooks from '../src/hooks';

describe('feathers-hooks', () => {
  it('always turns service call into a promise (#28)', () => {
    const app = feathers().configure(hooks()).use('/dummy', {
      get (id, params, callback) {
        callback(null, { id });
      }
    });

    const service = app.service('dummy');

    return service.get(10).then(data => {
      assert.deepEqual(data, { id: 10 });
    });
  });

  it('works with services that return a promise (#28)', () => {
    const app = feathers().configure(hooks()).use('/dummy', {
      get (id, params) {
        return Promise.resolve({ id, user: params.user });
      }
    });

    const service = app.service('dummy');

    service.before({
      get (hook) {
        hook.params.user = 'David';
      }
    }).after({
      get (hook) {
        hook.result.after = true;
      }
    });

    return service.get(10).then(data => {
      assert.deepEqual(data, { id: 10, user: 'David', after: true });
    });
  });

  it('dispatches events with data modified by hook', done => {
    const app = feathers().configure(hooks()).use('/dummy', {
      create (data) {
        return Promise.resolve(data);
      }
    });

    const service = app.service('dummy');

    service.before({
      create (hook) {
        hook.data.user = 'David';
      }
    }).after({
      create (hook) {
        hook.result.after = true;
      }
    });

    service.once('created', function (data) {
      try {
        assert.deepEqual(data, {
          test: true,
          user: 'David',
          after: true
        });
        done();
      } catch (e) {
        done(e);
      }
    });

    service.create({ test: true });
  });

  it('does not error when result is null', () => {
    const app = feathers().configure(hooks()).use('/dummy', {
      get (id, params, callback) {
        callback(null, { id });
      }
    });

    const service = app.service('dummy');

    service.after({
      get: [
        function (hook) {
          hook.result = null;
          return hook;
        },
        hooks.remove('title')
      ]
    });

    return service.get(1)
      .then(result => assert.equal(result, null));
  });
});
