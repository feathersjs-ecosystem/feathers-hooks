import assert from 'assert';
import feathers from 'feathers';

import hooks from '../src/hooks';

describe('feathers-hooks', () => {
  it('always turns service call into a promise (#28)', done => {
    const app = feathers().configure(hooks()).use('/dummy', {
      get(id, params, callback) {
        callback(null, { id });
      }
    });

    const service = app.service('dummy');

    service.get(10).then(data => {
      assert.deepEqual(data, { id: 10 });
      done();
    });
  });

  it('works with services that return a promise (#28)', done => {
    const app = feathers().configure(hooks()).use('/dummy', {
      get(id, params) {
        return Promise.resolve({ id, user: params.user });
      }
    });

    const service = app.service('dummy');

    service.before({
      get(hook) {
        hook.params.user = 'David';
      }
    }).after({
      get(hook) {
        hook.result.after = true;
      }
    });

    service.get(10).then(data => {
      assert.deepEqual(data, { id: 10, user: 'David', after: true });
      done();
    });
  });
});
