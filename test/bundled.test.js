import assert from 'assert';
import feathers from 'feathers';
import rest from 'feathers-rest';
import memory from 'feathers-memory';
import {errors} from 'feathers-errors';
import hooks from '../src/hooks';

const addProvider = function(){
  return function(hook){
    hook.params.provider = 'rest';
  };
};

const app = feathers()
  .configure(rest())
  .configure(hooks())
  .use('/todos', memory());

const service = app.service('/todos');

describe('Bundled feathers hooks', () => {
  beforeEach(done => {
    service.create([
      {id: 1, name: 'Marshall', title: 'Old Man', admin: true, updatedBy : { email : 'admin@feathersjs.com', roles : ['admin'] } },
      {id: 2, name: 'David', title: 'Genius', admin: true, updatedBy : { email : 'admin@feathersjs.com', roles : ['admin'] } },
      {id: 3, name: 'Eric', title: 'Badass', admin: true, updatedBy : { email : 'admin@feathersjs.com', roles : ['admin'] } },
    ]).then(() => done());
  });

  afterEach(done => {
    service.remove(null).then(() => done()).catch(e => console.log(e));
  });

  describe('lowerCase', () => {
    it('transforms to lower case fields from objects in arrays', done => {
      service.after({
        find: hooks.lowerCase('name')
      });

      service.find().then(data => {
        assert.equal(data[0].name, 'marshall');
        assert.equal(data[1].name, 'david');
        assert.equal(data[2].name, 'eric');
        // Remove the hook we just added
        service.__afterHooks.find.pop();
        done();
      }).catch(done);
    });

    it('transforms to lower case fields from single objects', done => {
      service.after({
        get: hooks.lowerCase('name')
      });

      service.get(1).then(data => {
        assert.equal(data.name, 'marshall');
        // Remove the hook we just added
        service.__afterHooks.get.pop();
        done();
      }).catch(done);
    });

    it('transforms to lower case fields from data if it is a before hook', done => {
      service.before({
        create: hooks.lowerCase('name')
      });

      service.create({
        id: 4,
        name: 'David'
      }).then(data => {
        assert.equal(data.name, 'david');
        assert.equal(data.id, 4);
        // Remove the hook we just added
        service.__beforeHooks.create.pop();
        done();
      }).catch(done);
    });

    it('transforms to lower case only string fields', done => {
      service.after({
        get: hooks.lowerCase('admin')
      });

      service.get(1).catch(data => {
        assert.ok(data instanceof errors.BadRequest);
        service.__afterHooks.get.pop();
        done();
      });
    });

    it('ignores undefined fields', done => {
      service.before({
        patch: hooks.lowerCase('name')
      });

      assert.doesNotThrow(
        () => {
          service.patch(1, {
            title: 'Wizard'
          }).then(data => {
            assert.equal(data.title, 'Wizard');
            // Remove the hook we just added
            service.__beforeHooks.patch.pop();
            done();
          }).catch(done);
        },
        TypeError
      );
    });
  });

  describe('remove', () => {
    describe('with params.provider set', () => {
      before(() => {
        service.before({
          find: addProvider(),
          get: addProvider(),
          create: addProvider()
        });
      });

      after(() => {
        // remove our before hooks
        service.__beforeHooks.find.pop();
        service.__beforeHooks.get.pop();
        service.__beforeHooks.create.pop();
      });

      it('Removes fields from objects in arrays', done => {
        service.after({
          find: hooks.remove('title')
        });

        service.find().then(data => {
          assert.equal(data[0].title, undefined);
          assert.equal(data[1].title, undefined);
          assert.equal(data[2].title, undefined);
          // Remove the hook we just added
          service.__afterHooks.find.pop();
          done();
        }).catch(done);
      });

      it('Removes multiple fields from single objects', done => {
        service.after({
          get: hooks.remove('admin', 'title')
        });

        service.get(1).then(data => {
          assert.equal(data.admin, undefined);
          assert.equal(data.title, undefined);
          // Remove the hook we just added
          service.__afterHooks.get.pop();
          done();
        }).catch(done);
      });

      it('Removes fields from result.data object', done => {
        service.after({
          get: [
            function(hook) {
              var data = Object.assign({}, hook.result);
              hook.result = { data };
              return hook;
            },
            hooks.remove('title')
          ]
        });

        service.get(1).then(result => {
          assert.equal(result.data.title, undefined);
          // Remove the hooks we just added
          service.__afterHooks.find.pop();
          service.__afterHooks.find.pop();
          done();
        }).catch(done);
      });

      it('removes fields from data if it is a before hook', done => {
        service.before({
          create: hooks.remove('_id')
        });

        service.create({
          _id: 10,
          name: 'David'
        }).then(data => {
          assert.equal(data.name, 'David');
          assert.equal(data._id, undefined);
          // Remove the hook we just added
          service.__beforeHooks.create.pop();
          done();
        }).catch(done);
      });

      it('removes field with a callback', done => {
        const original = {
          id: 10,
          age: 12,
          test: 'David'
        };

        service.before({
          create: hooks.remove('test', hook => hook.params.remove)
        });

        service.create(original).then(data => {
          assert.deepEqual(data, original);
          original.id = 11;

          return service.create(original, { remove: true });
        }).then(data => {
          assert.deepEqual(data, { age: 12, id: 11 });
          // Remove the hook we just added
          service.__beforeHooks.create.pop();
          done();
        }).catch(done);
      });

      it('removes field with callback that returns a Promise', done => {
        const original = {
          id: 23,
          age: 12,
          test: 'David'
        };

        service.before({
          create: hooks.remove('test', hook => new Promise(resolve => {
            setTimeout(() => resolve(hook.params.remove), 20);
          }))
        });

        service.create(original).then(data => {
          assert.deepEqual(data, original);
          original.id = 24;

          return service.create(original, { remove: true });
        }).then(data => {
          assert.deepEqual(data, { age: 12, id: 24 });
          // Remove the hook we just added
          service.__beforeHooks.create.pop();
          done();
        }).catch(done);
      });

      it('Removes nested fields from result.data object', done => {
        service.after({
          get: [
            hooks.remove('updatedBy.roles')
          ]
        });

        service.get(1).then(result => {
          assert.equal(result.data.updatedBy.roles, undefined);
          assert.equal(result.data.updatedBy.email, 'admin@feathersjs.com');
          // Remove the hooks we just added
          service.__afterHooks.find.pop();
          service.__afterHooks.find.pop();
          done();
        }).catch(done);
      });
    });

    describe('without params.provider set', () => {
      it('does not remove fields', done => {
        service.after({
          find: hooks.remove('title')
        });

        service.find().then(data => {
          assert.equal(data[0].title, 'Old Man');
          assert.equal(data[1].title, 'Genius');
          assert.equal(data[2].title, 'Badass');
          // Remove the hook we just added
          service.__afterHooks.find.pop();
          done();
        }).catch(done);
      });
    });
  });

  describe('pluck', () => {
    describe('with params.provider set', () => {
      before(() => {
        service.before({
          find: addProvider(),
          get: addProvider(),
          create: addProvider()
        });
      });

      after(() => {
        // remove our before hooks
        service.__beforeHooks.find.pop();
        service.__beforeHooks.get.pop();
        service.__beforeHooks.create.pop();
      });
      // {id: 1, name: 'Marshall', title: 'Old Man', admin: true},
      // {id: 2, name: 'David', title: 'Genius', admin: true},
      // {id: 3, name: 'Eric', title: 'Badass', admin: true}
      it('plucks fields from objects in arrays', done => {
        service.after({
          find: hooks.pluck('id', 'title')
        });

        service.find().then(data => {
          assert.equal(data[0].name, undefined);
          assert.equal(data[1].name, undefined);
          assert.equal(data[2].name, undefined);
          assert.equal(data[0].admin, undefined);
          assert.equal(data[1].admin, undefined);
          assert.equal(data[2].admin, undefined);
          // Remove the hook we just added
          service.__afterHooks.find.pop();
          done();
        }).catch(done);
      });

      it('plucks multiple fields from single objects', done => {
        service.after({
          get: hooks.pluck('id', 'admin')
        });

        service.get(1).then(data => {
          assert.equal(data.name, undefined);
          assert.equal(data.title, undefined);
          // Remove the hook we just added
          service.__afterHooks.get.pop();
          done();
        }).catch(done);
      });

      it('plucks fields from data if it is a before hook', done => {
        service.before({
          create: hooks.pluck('_id', 'id')
        });

        service.create({
          _id: 15,
          id: 20,
          name: 'David'
        }).then(data => {
          assert.equal(data._id, 15);
          assert.equal(data.name, undefined);
          // Remove the hook we just added
          service.__beforeHooks.create.pop();
          done();
        }).catch(done);
      });

      it('plucks field with a callback', done => {
        const original = {
          id: 10,
          age: 12,
          test: 'David'
        };

        service.before({
          create: hooks.pluck('id', 'age', hook => hook.params.pluck)
        });

        service.create(original).then(data => {
          assert.deepEqual(data, original);
          original.id = 11;

          return service.create(original, { pluck: true });
        }).then(data => {
          assert.deepEqual(data, { age: 12, id: 11 });
          // Remove the hook we just added
          service.__beforeHooks.create.pop();
          done();
        }).catch(done);
      });

      it('plucks field with callback that returns a Promise', done => {
        const original = {
          id: 23,
          age: 12,
          test: 'David'
        };

        service.before({
          create: hooks.pluck('id', 'age', hook => new Promise(resolve => {
            setTimeout(() => resolve(hook.params.pluck), 20);
          }))
        });

        service.create(original).then(data => {
          assert.deepEqual(data, original);
          original.id = 24;

          return service.create(original, { pluck: true });
        }).then(data => {
          assert.deepEqual(data, { age: 12, id: 24 });
          // Remove the hook we just added
          service.__beforeHooks.create.pop();
          done();
        }).catch(done);
      });
    });

    describe('without params.provider set', () => {
      it('does not pluck fields', done => {
        service.after({
          find: hooks.pluck('id', 'age')
        });

        service.find().then(data => {
          assert.equal(data[0].title, 'Old Man');
          assert.equal(data[1].title, 'Genius');
          assert.equal(data[2].title, 'Badass');
          // Remove the hook we just added
          service.__afterHooks.find.pop();
          done();
        }).catch(done);
      });
    });
  });

  describe('pluckQuery', () => {
    it('Plucks fields from query', done => {
      service.before({
        find: hooks.pluckQuery('name', 'id')
      });

      service.find({query: {admin: false, name: 'David'}}).then(data => {
        assert.equal(data.length, 1);
        assert.deepEqual(data[0], {
          id: 2,
          name: 'David',
          title: 'Genius',
          admin: true,
          updatedBy : { email : 'admin@feathersjs.com', roles : ['admin']}
        });
        // Remove the hook we just added
        service.__beforeHooks.find.pop();
        done();
      }).catch(done);
    });

    it('Throws error if placed in after', done => {
      service.after({
        find: hooks.pluckQuery('admin', 'title')
      });

      service.find({query: {admin: true, name: 'David'}}).then(done).catch(e => {
        assert.equal(e.name, 'GeneralError');

        // Remove the hook we just added
        service.__afterHooks.find.pop();
        done();
      });
    });
  });

  describe('removeQuery', () => {
    it('Removes fields from query', done => {
      service.before({
        find: hooks.removeQuery('name')
      });

      service.find({query: {admin: true, name: 'David'}}).then(data => {
        assert.equal(data.length, 3);
        // Remove the hook we just added
        service.__beforeHooks.find.pop();
        done();
      }).catch(done);
    });

    it('Throws error if placed in after', done => {
      service.after({
        find: hooks.removeQuery('admin', 'title')
      });

      service.find({query: {admin: true, name: 'David'}}).then(done).catch(e => {
        assert.equal(e.name, 'GeneralError');

        // Remove the hook we just added
        service.__afterHooks.find.pop();
        done();
      });
    });
  });

  describe('disable', () => {
    it('disables completely', done => {
      service.before({
        remove: hooks.disable()
      });

      service.remove().catch(e => {
        assert.equal(e.message, `Calling 'remove' not allowed.`);
        // Remove the hook we just tested
        service.__beforeHooks.remove.pop();
        done();
      }).catch(done);
    });

    it('disables provider for external', done => {
      service.before({
        remove: hooks.disable('external')
      });

      service.remove(0, { provider: 'test' }).catch(e => {
        assert.equal(e.message, `Provider 'test' can not call 'remove'`);
        // Remove the hook we just tested
        service.__beforeHooks.remove.pop();
        done();
      }).catch(done);
    });

    it('disables for a specific provider', done => {
      service.before({
        remove: hooks.disable('testing')
      });

      service.remove(0, { provider: 'testing' }).catch(e => {
        assert.equal(e.message, `Provider 'testing' can not call 'remove'`);
        // Remove the hook we just tested
        service.__beforeHooks.remove.pop();
        done();
      }).catch(done);
    });

    it('disables multiple providers', done => {
      service.before({
        remove: hooks.disable('testing', 'again')
      });

      service.remove(0, { provider: 'testing' }).catch(e => {
        assert.equal(e.message, `Provider 'testing' can not call 'remove'`);

        return service.remove(0, { provider: 'again' }).catch(e => {
          assert.equal(e.message, `Provider 'again' can not call 'remove'`);
          // Remove the hook we just tested
          service.__beforeHooks.remove.pop();
          done();
        });
      }).catch(done);
    });

    it('disables with a function', done => {
      service.before({
        remove: hooks.disable(function(hook) {
          if(hook.params.disable) {
            throw new Error('Not allowed!');
          }
        })
      });

      service.remove(0, { disable: true }).catch(e => {
        assert.equal(e.message, 'Not allowed!');
        // Remove the hook we just tested
        service.__beforeHooks.remove.pop();
        done();
      }).catch(done);
    });

    it('disables with a function that returns a promise', done => {
      service.before({
        remove: hooks.disable(function(hook) {
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              if(hook.params.disable) {
                reject(new Error('Not allowed!'));
              }
            }, 20);
          });
        })
      });

      service.remove(0, { disable: true }).catch(e => {
        assert.equal(e.message, 'Not allowed!');
        // Remove the hook we just tested
        service.__beforeHooks.remove.pop();
        done();
      }).catch(done);
    });
  });

  describe('populate', () => {
    let app;

    before(() => {
      app = feathers()
        .configure(rest())
        .configure(hooks())
        .use('/todos', memory())
        .use('/users', {
          get(id, params) {
            // Check that there's nothing in the query field if it's set as it can mess with some drivers
            if(params.query && Object.keys(params.query).length) {
              return Promise.reject(new Error('Query includes fields: ' + Object.keys(params.query).join(', ')));
            }

            return Promise.resolve({
              id, name: `user ${id}`
            });
          }
        })
        // using groups service to test array population
        .use('/groups', {
          get(id) {
            return Promise.resolve({
              id, name: `group ${id}`
            });
          }
        });
    });

    it('populates the same field', done => {
      app.service('todos').after({
        create: hooks.populate('user', { service: 'users' })
      });

      app.service('todos').create({
        text: 'A todo',
        user: 10
      }).then(todo => {
        assert.deepEqual(todo, {
          text: 'A todo',
          user: { id: 10, name: 'user 10' },
          id: 0
        });
        service.__afterHooks.create.pop();
        done();
      }).catch(done);
    });

    it('populates a different field', done => {
      app.service('todos').after({
        create: hooks.populate('user', {
          service: 'users',
          field: 'userId'
        })
      });

      app.service('todos').create({
        text: 'A todo',
        userId: 10
      }).then(todo => {
        assert.deepEqual(todo, {
          text: 'A todo',
          userId: 10,
          user: { id: 10, name: 'user 10' },
          id: 1
        });
        service.__afterHooks.create.pop();
        done();
      }).catch(done);
    });

    it('populates an array', done => {
      app.service('todos').after({
        create: hooks.populate('groups', {
          service: 'groups'
        })
      });

      app.service('todos').create({
        'text': 'A todo',
        groups: [12, 13]
      })
      .then(todo => {
          assert.deepEqual(todo, {
            text: 'A todo',
            groups: [ { id: 12, name: 'group 12'}, { id: 13, name: 'group 13' }],
            id: 2
          });
          service.__afterHooks.create.pop();
          done();
      }).catch(done);
    });

    it('populates queried results', done => {
      app.service('todos').after({
        find: hooks.populate('user', {
          service: 'users',
          field: 'userId'
        })
      });

      app.service('todos').create({
        text: 'Queried todo',
        userId: 15
      }).then(() => {
        return app.service('todos').find({
          query: {
            text: 'Queried todo'
          }
        });
      }).then(todos => {
        assert.deepEqual(todos, [{
          text: 'Queried todo',
          userId: 15,
          user: { id: 15, name: 'user 15' },
          id: 3
        }]);
        done();
      }).catch(done);
    });
  });
});
