# Feathers Hooks

[![Build Status](https://travis-ci.org/feathersjs/feathers-hooks.png?branch=master)](https://travis-ci.org/feathersjs/feathers-hooks)

> Before and after service method call hooks for easy authorization and processing.

## Getting Started

To install feathers-hooks from [npm](https://www.npmjs.org/), run:

```bash
$ npm install feathers-hooks --save
```

Finally, to use the plugin in your Feathers app:

```javascript
var feathers = require('feathers');
var hooks = require('feathers-hooks');

var app = feathers().configure(hooks());
```

## Using hooks

Feathers hooks are a form of [Aspect Oriented Programming](http://en.wikipedia.org/wiki/Aspect-oriented_programming)
that allow you to decouple things like authorization and pre- or post processing from your services logic.

You can add as many `before` and `after` hooks to any Feathers service method as you want (they will be executed in the
order they have been registered). There are two ways to use hooks. Either after registering the service by calling
`service.before(beforeHooks)` or `service.after(afterHook)` or by adding a `before` or `after` object with your hooks to the service.

Lets assume a Feathers application initialized like this:

```js
var feathers = require('feathers');

var app = feathers()
    .configure(feathers.socketio())
    .use('/todos', {
       todos: [],

       get: function(id, params, callback) {
         for(var i = 0; i < this.todos.length; i++) {
          if(this.todos[i].id === id) {
            return callback(null, this.todos[i]);
          }
         }

         callback(new Error('Todo not found'));
       },

       // Return all todos from this service
       find: function(params, callback) {
         callback(null, this.todos);
       },

       // Create a new Todo with the given data
       create: function(data, params, callback) {
         data.id = this.todos.length;
         this.todos.push(data);

         callback(null, data);
       }
     })
    .listen(8000);

// Get the wrapped service object which will be used in the other exapmles
var todoService = app.lookup('todos');
```

### `service.before(beforeHooks)`

`before` hooks allow to pre-process service call parameters. They will be called with the original service parameters
and a callback which should be called with the same (potentially modified) parameters and an error (for example, when
a user is not authorized, `null` for now error).
The following example checks if a user has been passed to the services `find` method and returns an error if not
and also adds a `createdAt` property to a newly created todo:

```js
todoService.before({
  find: function (params, callback) {
    if (!params.user) {
      return callback(new Error('You are not logged in'));
    }
    callback(null, params);
  },

  create: function(data, params, callback) {
    data.createdAt = new Date();

    callback(null, data, params);
  }
});
```

### `service.after(afterHooks)`

`after` hooks will be called with the result of the service call, the original parameters and a callback. The following example
filters the data returned by a `find` service call based on a users company id and checks if the current user is allowed
to retrieve the data returned by `get` (that is, they have the same company id):

```js
todoService.after({
  find: function (data, params, callback) {
    // Manually filter the find results
    var filtered = _.filter(data, function (current) {
      return current.companyId === params.user.companyId;
    });

    callback(null, filtered);
  },

  get: function (data, id, params, callback) {
    if (data.companyId !== params.user.companyId) {
      return callback(new Error('You are not authorized to access this information'));
    }

    callback(null, data);
  }
});
```

### As service properties

You can also add `before` and `after` hooks to your initial service object right away by setting the `before` and
`after` properties to the hook object:

```js
var TodoService = {
  before: {
    find: function (params, callback) {
      if (!params.user) {
        return callback(new Error('You are not logged in'));
      }
      callback(null, params);
    },

    get: function (id, params, callback) {
      // Pre-process the params passed to the actual service
      params.something = 'test';

      callback(null, id, params);
    }
  },

  after: {
    find: function (data, params, callback) {
      // Manually filter the find results
      var filtered = _.filter(data, function (current) {
        return current.companyId === params.user.companyId;
      });

      callback(null, filtered);
    },

    get: function (data, id, params, callback) {
      if (data.companyId !== params.user.companyId) {
        return callback(new Error('You are not authorized to access this information'));
      }

      callback(null, data);
    }
  }
}
```

## Author

- [David Luecke](https://github.com/daffl)

## License

Copyright (c) 2014 David Luecke

Licensed under the [MIT license](LICENSE).
