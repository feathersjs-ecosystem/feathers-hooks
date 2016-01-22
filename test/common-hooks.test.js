import assert from 'assert';
import feathers from 'feathers';
import memory from 'feathers-memory';
import feathersHooks from '../src/hooks';
import hooks from '../hooks';

const app = feathers()
  .configure(feathers.rest())
  .configure(feathersHooks())
  .use('/todos', memory());

const service = app.service('/todos');
service.after({
  find: [hooks.removeFields('title')],
  get: [hooks.removeFields('admin')]
});

service.create([
  {id: 1, name: 'Marshall', title: 'Old Man', admin: true},
  {id: 2, name: 'David', title: 'Genius', admin: true},
  {id: 3, name: 'Eric', title: 'Badass', admin: true}
]);

describe('Common feathers-hooks', () => {
  it('Removes fields from objects in arrays', done => {
    service.find().then(data => {
      assert.equal(data[0].title, undefined);
      assert.equal(data[1].title, undefined);
      assert.equal(data[2].title, undefined);
      done();
    });
  });

  it('Removes fields from single objects', done => {
    service.get(1).then(data => {
      assert.equal(data.admin, undefined);
      done();
    });
  });

});
