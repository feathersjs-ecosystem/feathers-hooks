import assert from 'assert';
import feathers from 'feathers';
import rest from 'feathers-rest';
import memory from 'feathers-memory';
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
      {id: 1, name: 'Marshall', title: 'Old Man', admin: true},
      {id: 2, name: 'David', title: 'Genius', admin: true},
      {id: 3, name: 'Eric', title: 'Badass', admin: true}
    ]).then(() => done());
  });

  afterEach(done => {
    service.remove(null).then(() => done());
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
>>>>>>> only run remove hook if params.provider is set
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
});
