import assert from 'assert';
import feathers from 'feathers';
import rest from 'feathers-rest';
import memory from 'feathers-memory';
import { errors } from 'feathers-errors';
import mongoose from 'mongoose';
import mongooseService from 'feathers-mongoose';
import hooks from '../src/hooks';

const addProvider = function () {
  return function (hook) {
    hook.params.provider = 'rest';
  };
};

const app = feathers()
  .configure(rest())
  .configure(hooks())
  .use('/todos', memory());

const service = app.service('/todos');

describe('Bundled feathers hooks', () => {
  beforeEach(() => {
    return service.create([
      { id: 1, name: 'Marshall', title: 'Old Man', admin: true, updatedBy: { email: 'admin@feathersjs.com', roles: ['admin'] } },
      { id: 2, name: 'David', title: 'Genius', admin: true, updatedBy: { email: 'admin@feathersjs.com', roles: ['admin'] } },
      { id: 3, name: 'Eric', title: 'Badass', admin: true, updatedBy: { email: 'admin@feathersjs.com', roles: ['admin'] } }
    ]);
  });

  afterEach(done => {
    service.remove(null).then(() => done()).catch(e => console.log(e));
  });

  describe('lowerCase', () => {
    it('transforms to lower case fields from objects in arrays', () => {
      service.after({
        find: hooks.lowerCase('name')
      });

      return service.find().then(data => {
        assert.equal(data[0].name, 'marshall');
        assert.equal(data[1].name, 'david');
        assert.equal(data[2].name, 'eric');
        // Remove the hook we just added
        service.__hooks.after.find.pop();
      });
    });

    it('transforms to lower case fields from single objects', () => {
      service.after({
        get: hooks.lowerCase('name')
      });

      return service.get(1).then(data => {
        assert.equal(data.name, 'marshall');
        // Remove the hook we just added
        service.__hooks.after.get.pop();
      });
    });

    it('transforms to lower case fields from data if it is a before hook', () => {
      service.before({
        create: hooks.lowerCase('name')
      });

      return service.create({
        id: 4,
        name: 'David'
      }).then(data => {
        assert.equal(data.name, 'david');
        assert.equal(data.id, 4);
        // Remove the hook we just added
        service.__hooks.before.create.pop();
      });
    });

    it('transforms to lower case only string fields', () => {
      service.after({
        get: hooks.lowerCase('admin')
      });

      return service.get(1).catch(data => {
        assert.ok(data instanceof errors.BadRequest);
        service.__hooks.after.get.pop();
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
            service.__hooks.before.patch.pop();
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
        service.__hooks.before.find.pop();
        service.__hooks.before.get.pop();
        service.__hooks.before.create.pop();
      });

      it('removes fields from objects in arrays', () => {
        service.after({
          find: hooks.remove('title')
        });

        return service.find().then(data => {
          assert.equal(data[0].title, undefined);
          assert.equal(data[1].title, undefined);
          assert.equal(data[2].title, undefined);
          // Remove the hook we just added
          service.__hooks.after.find.pop();
        });
      });

      it('removes multiple fields from single objects', () => {
        service.after({
          get: hooks.remove('admin', 'title')
        });

        return service.get(1).then(data => {
          assert.equal(data.admin, undefined);
          assert.equal(data.title, undefined);
          // Remove the hook we just added
          service.__hooks.after.get.pop();
        });
      });

      it('removes fields from result.data object', () => {
        service.after({
          get: [
            function (hook) {
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
          service.__hooks.after.get.pop();
          service.__hooks.after.get.pop();
        });
      });

      it('removes fields from data if it is a before hook', () => {
        service.before({
          create: hooks.remove('_id')
        });

        return service.create({
          _id: 10,
          name: 'David'
        }).then(data => {
          assert.equal(data.name, 'David');
          assert.equal(data._id, undefined);
          // Remove the hook we just added
          service.__hooks.before.create.pop();
        });
      });

      it('removes field with a callback', () => {
        const original = {
          id: 10,
          age: 12,
          test: 'David'
        };

        service.before({
          create: hooks.remove('test', hook => hook.params.remove)
        });

        return service.create(original).then(data => {
          assert.deepEqual(data, original);
          original.id = 11;

          return service.create(original, { remove: true });
        }).then(data => {
          assert.deepEqual(data, { age: 12, id: 11 });
          // Remove the hook we just added
          service.__hooks.before.create.pop();
        });
      });

      it('removes field with callback that returns a Promise', () => {
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

        return service.create(original).then(data => {
          assert.deepEqual(data, original);
          original.id = 24;

          return service.create(original, { remove: true });
        }).then(data => {
          assert.deepEqual(data, { age: 12, id: 24 });
          // Remove the hook we just added
          service.__hooks.before.create.pop();
        });
      });

      it('removes nested fields from result.data object', () => {
        service.after({
          get: [
            hooks.remove('updatedBy.roles')
          ]
        });

        return service.get(1).then(data => {
          assert.equal(data.updatedBy.roles, undefined);
          assert.equal(data.updatedBy.email, 'admin@feathersjs.com');
          // Remove the hooks we just added
          service.__hooks.after.get.pop();
        });
      });

      describe('with mongoose', () => {
        let DemoUserModel;
        let usersService;

        before(() => {
          mongoose.connect('mongodb://localhost:27017/feathes-hooks-dev');
          mongoose.Promise = Promise;

          const Schema = mongoose.Schema;
          const DemoUserSchema = new Schema({
            id: { type: Number, required: true },
            name: { type: String, required: true },
            email: { type: String, required: true },
            password: { type: String, required: true }
          });
          DemoUserModel = mongoose.model('DemoUser', DemoUserSchema);
          app.use('/users', mongooseService({ Model: DemoUserModel, id: 'id' }));
          usersService = app.service('/users');

          usersService.before({
            find: addProvider(),
            get: addProvider(),
            create: addProvider()
          });
        });

        beforeEach(() => DemoUserModel.insertMany([
          { id: 1, name: 'Marshall', email: 'admin@feathersjs.com', password: '1337' },
          { id: 2, name: 'David', email: 'admin@feathersjs.com', password: '1337' },
          { id: 3, name: 'Eric', email: 'admin@feathersjs.com', password: '1337' }
        ]));

        afterEach(done => {
          DemoUserModel.remove({}).then(() => done());
        });

        after(done => {
          usersService.__hooks.before.find.pop();
          usersService.__hooks.before.get.pop();
          usersService.__hooks.before.create.pop();
          mongoose.connection.close();
          done();
        });

        it('removes fields from single mongoose object', () => {
          usersService.after({
            get: [hooks.remove('email', 'password')]
          });

          return usersService.get(1).then(data => {
            assert.equal(data.id, 1);
            assert.equal(data.name, 'Marshall');
            assert.equal(data.email, undefined);
            assert.equal(data.password, undefined);

            usersService.__hooks.after.get.pop();
          });
        });

        it('removes fields from mongoose objects in array', () => {
          usersService.after({
            find: [hooks.remove('email', 'password')]
          });

          return usersService.find().then(data => {
            assert.equal(data[0].id, 1);
            assert.equal(data[0].name, 'Marshall');
            assert.equal(data[0].email, undefined);
            assert.equal(data[0].password, undefined);

            assert.equal(data[1].id, 2);
            assert.equal(data[1].name, 'David');
            assert.equal(data[1].email, undefined);
            assert.equal(data[1].password, undefined);

            assert.equal(data[2].id, 3);
            assert.equal(data[2].name, 'Eric');
            assert.equal(data[2].email, undefined);
            assert.equal(data[2].password, undefined);

            usersService.__hooks.after.find.pop();
          });
        });
      });
    });

    describe('without params.provider set', () => {
      it('does not remove fields', () => {
        service.after({
          find: hooks.remove('title')
        });

        return service.find().then(data => {
          assert.equal(data[0].title, 'Old Man');
          assert.equal(data[1].title, 'Genius');
          assert.equal(data[2].title, 'Badass');
          // Remove the hook we just added
          service.__hooks.after.find.pop();
        });
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
        service.__hooks.before.find.pop();
        service.__hooks.before.get.pop();
        service.__hooks.before.create.pop();
      });
      // {id: 1, name: 'Marshall', title: 'Old Man', admin: true},
      // {id: 2, name: 'David', title: 'Genius', admin: true},
      // {id: 3, name: 'Eric', title: 'Badass', admin: true}
      it('plucks fields from objects in arrays', () => {
        service.after({
          find: hooks.pluck('id', 'title')
        });

        return service.find().then(data => {
          assert.equal(data[0].name, undefined);
          assert.equal(data[1].name, undefined);
          assert.equal(data[2].name, undefined);
          assert.equal(data[0].admin, undefined);
          assert.equal(data[1].admin, undefined);
          assert.equal(data[2].admin, undefined);
          // Remove the hook we just added
          service.__hooks.after.find.pop();
        });
      });

      it('plucks multiple fields from single objects', () => {
        service.after({
          get: hooks.pluck('id', 'admin')
        });

        return service.get(1).then(data => {
          assert.equal(data.name, undefined);
          assert.equal(data.title, undefined);
          // Remove the hook we just added
          service.__hooks.after.get.pop();
        });
      });

      it('plucks fields from data if it is a before hook', () => {
        service.before({
          create: hooks.pluck('_id', 'id')
        });

        return service.create({
          _id: 15,
          id: 20,
          name: 'David'
        }).then(data => {
          assert.equal(data._id, 15);
          assert.equal(data.name, undefined);
          // Remove the hook we just added
          service.__hooks.before.create.pop();
        });
      });

      it('plucks field with a callback', () => {
        const original = {
          id: 10,
          age: 12,
          test: 'David'
        };

        service.before({
          create: hooks.pluck('id', 'age', hook => hook.params.pluck)
        });

        return service.create(original).then(data => {
          assert.deepEqual(data, original);
          original.id = 11;

          return service.create(original, { pluck: true });
        }).then(data => {
          assert.deepEqual(data, { age: 12, id: 11 });
          // Remove the hook we just added
          service.__hooks.before.create.pop();
        });
      });

      it('plucks field with callback that returns a Promise', () => {
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

        return service.create(original).then(data => {
          assert.deepEqual(data, original);
          original.id = 24;

          return service.create(original, { pluck: true });
        }).then(data => {
          assert.deepEqual(data, { age: 12, id: 24 });
          // Remove the hook we just added
          service.__hooks.before.create.pop();
        });
      });
    });

    describe('without params.provider set', () => {
      it('does not pluck fields', () => {
        service.after({
          find: hooks.pluck('id', 'age')
        });

        return service.find().then(data => {
          assert.equal(data[0].title, 'Old Man');
          assert.equal(data[1].title, 'Genius');
          assert.equal(data[2].title, 'Badass');
          // Remove the hook we just added
          service.__hooks.after.find.pop();
        });
      });
    });
  });

  describe('pluckQuery', () => {
    it('Plucks fields from query', () => {
      service.before({
        find: hooks.pluckQuery('name', 'id')
      });

      return service.find({ query: { admin: false, name: 'David' } })
        .then(data => {
          assert.equal(data.length, 1);
          assert.deepEqual(data[0], {
            id: 2,
            name: 'David',
            title: 'Genius',
            admin: true,
            updatedBy: { email: 'admin@feathersjs.com', roles: ['admin'] }
          });
          // Remove the hook we just added
          service.__hooks.before.find.pop();
        });
    });

    it('Throws error if placed in after', () => {
      service.after({
        find: hooks.pluckQuery('admin', 'title')
      });

      return service.find({
        query: { admin: true, name: 'David' }
      }).catch(e => {
        assert.equal(e.name, 'GeneralError');

        // Remove the hook we just added
        service.__hooks.after.find.pop();
      });
    });
  });

  describe('removeQuery', () => {
    it('Removes fields from query', () => {
      service.before({
        find: hooks.removeQuery('name')
      });

      return service.find({query: {admin: true, name: 'David'}})
        .then(data => {
          assert.equal(data.length, 3);
          // Remove the hook we just added
          service.__hooks.before.find.pop();
        });
    });

    it('Throws error if placed in after', () => {
      service.after({
        find: hooks.removeQuery('admin', 'title')
      });

      return service.find({query: {admin: true, name: 'David'}})
        .catch(e => {
          assert.equal(e.name, 'GeneralError');

          // Remove the hook we just added
          service.__hooks.after.find.pop();
        });
    });
  });

  describe('disable', () => {
    it('disables completely', () => {
      service.before({
        remove: hooks.disable()
      });

      return service.remove().catch(e => {
        assert.equal(e.message, `Calling 'remove' not allowed. (disable)`);
        // Remove the hook we just tested
        service.__hooks.before.remove.pop();
      });
    });

    it('disables provider for external', () => {
      service.before({
        remove: hooks.disable('external')
      });

      return service.remove(0, { provider: 'test' }).catch(e => {
        assert.equal(e.message, `Provider 'test' can not call 'remove'. (disable)'`);
        // Remove the hook we just tested
        service.__hooks.before.remove.pop();
      });
    });

    it('disables for a specific provider', () => {
      service.before({
        remove: hooks.disable('testing')
      });

      return service.remove(0, { provider: 'testing' }).catch(e => {
        assert.equal(e.message, `Provider 'testing' can not call 'remove'. (disable)'`);
        // Remove the hook we just tested
        service.__hooks.before.remove.pop();
      });
    });

    it('disables multiple providers', () => {
      service.before({
        remove: hooks.disable('testing', 'again')
      });

      return service.remove(0, { provider: 'testing' }).catch(e => {
        assert.equal(e.message, `Provider 'testing' can not call 'remove'. (disable)'`);

        return service.remove(0, { provider: 'again' }).catch(e => {
          assert.equal(e.message, `Provider 'again' can not call 'remove'. (disable)'`);
          // Remove the hook we just tested
          service.__hooks.before.remove.pop();
        });
      });
    });

    it('disables with a function', () => {
      service.before({
        remove: hooks.disable(function (hook) {
          if (hook.params.disable) {
            throw new Error('Not allowed!');
          }
        })
      });

      return service.remove(0, { disable: true }).catch(e => {
        assert.equal(e.message, 'Not allowed!');
        // Remove the hook we just tested
        service.__hooks.before.remove.pop();
      });
    });

    it('disables with a function that returns a promise', () => {
      service.before({
        remove: hooks.disable(function (hook) {
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              if (hook.params.disable) {
                reject(new Error('Not allowed!'));
              }
            }, 20);
          });
        })
      });

      return service.remove(0, { disable: true }).catch(e => {
        assert.equal(e.message, 'Not allowed!');
        // Remove the hook we just tested
        service.__hooks.before.remove.pop();
      });
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
          get (id, params) {
            // Check that there's nothing in the query field if it's set as it can mess with some drivers
            if (params.query && Object.keys(params.query).length) {
              return Promise.reject(new Error('Query includes fields: ' + Object.keys(params.query).join(', ')));
            }

            return Promise.resolve({
              id, name: `user ${id}`
            });
          }
        })
        // using groups service to test array population
        .use('/groups', {
          get (id) {
            return Promise.resolve({
              id, name: `group ${id}`
            });
          }
        });
    });

    it('populates the same field', () => {
      app.service('todos').after({
        create: hooks.populate('user', { service: 'users' })
      });

      return app.service('todos').create({
        text: 'A todo',
        user: 10
      }).then(todo => {
        assert.deepEqual(todo, {
          text: 'A todo',
          user: { id: 10, name: 'user 10' },
          id: 0
        });
        service.__hooks.after.create.pop();
      });
    });

    it('populates a different field', () => {
      app.service('todos').after({
        create: hooks.populate('user', {
          service: 'users',
          field: 'userId'
        })
      });

      return app.service('todos').create({
        text: 'A todo',
        userId: 10
      }).then(todo => {
        assert.deepEqual(todo, {
          text: 'A todo',
          userId: 10,
          user: { id: 10, name: 'user 10' },
          id: 1
        });
        service.__hooks.after.create.pop();
      });
    });

    it('populates an array', () => {
      app.service('todos').after({
        create: hooks.populate('groups', {
          service: 'groups'
        })
      });

      return app.service('todos').create({
        'text': 'A todo',
        groups: [12, 13]
      })
      .then(todo => {
        assert.deepEqual(todo, {
          text: 'A todo',
          groups: [ { id: 12, name: 'group 12' }, { id: 13, name: 'group 13' } ],
          id: 2
        });
        service.__hooks.after.create.pop();
      });
    });

    it('populates queried results', () => {
      app.service('todos').after({
        find: hooks.populate('user', {
          service: 'users',
          field: 'userId'
        })
      });

      return app.service('todos').create({
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
        service.__hooks.after.find.pop();
      });
    });
  });
});
