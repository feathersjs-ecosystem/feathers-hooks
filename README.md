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

## Examples

The repository contains the following working examples:

- [authorization.js](https://github.com/feathersjs/feathers-hooks/blob/master/examples/authorization.js) - A simple demo showing how to use hooks for authorization (and post-processing the results) where the user is set via a ?user=username query parameter.
- [timestamp.js](https://github.com/feathersjs/feathers-hooks/blob/master/examples/timestamp.js) - A demo that adds a `createdAt` and `updatedAt` timestamp when creating or updating a Todo using hooks.

## Using hooks

Feathers hooks are a form of [Aspect Oriented Programming](http://en.wikipedia.org/wiki/Aspect-oriented_programming)
that allow you to decouple things like authorization and pre- or post processing from your services logic.

You can add as many `before` and `after` hooks to any Feathers service method as you want (they will be executed in the
order they have been registered). There are two ways to use hooks. Either after registering the service by calling
`service.before(beforeHooks)` or `service.after(afterHooks)` or by adding a `before` or `after` object with your hooks to the service.

Lets assume a Feathers application initialized like this:

```js
var feathers = require('feathers');
var hooks = require('feathers-hooks');

var app = feathers()
    .configure(hooks())
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
     });

app.listen(8000);

// Get the wrapped service object which will be used in the other exapmles
var todoService = app.lookup('todos');
```

### `service.before(beforeHooks)`

`before` hooks allow to pre-process service call parameters. They will be called with the hook object
and a callback which should be called with any errors or no arguments or `null` and the modified hook object.
The hook object contains information about the intercepted method and for `before` hooks can have the following properties:

- __method__ - The method name
- __type__ - The hook type (`before` or `after`)
- __callback__ - The original callback (can be replaced but shouldn't be called in your hook)
- __params__ - The service method parameters
- __data__ - The request data (for `create`, `update` and `patch`)
- __id__ - The id (for `get`, `remove`, `update` and `patch`)

All properties of the hook object can be modified and the modified data will be used for the actual service method
call. This is very helpful for pre-processing parameters and massaging data when creating or updating.

The following example checks if a user has been passed to the services `find` method and returns an error if not
and also adds a `createdAt` property to a newly created todo:

```js
todoService.before({
  find: function (hook, next) {
    if (!hook.params.user) {
      return next(new Error('You are not logged in'));
    }
    
    next();
  },

  create: function(hook, next) {
    hook.data.createdAt = new Date();

    next();
    // Or
    next(null, hook);
  }
});
```

### `service.after(afterHooks)`

`after` hooks will be called with a similar hook object than `before` hooks but additionally contain a `result`
property with the service call results:

- __method__ - The method name
- __type__ - The hook type (`before` or `after`)
- __result__ - The service call result data
- __callback__ - The original callback (can be replaced but shouldn't be called in your hook)
- __params__ - The service method parameters
- __data__ - The request data (for `create`, `update` and `patch`)
- __id__ - The id (for `get`, `remove`, `update` and `patch`)

In any `after` hook, only modifications to the `result` object will have any effect. This is a good place to filter or
post-process the data retrieved by a service and also add some additional authorization that needs the actual data.

The following example filters the data returned by a `find` service call based on a users company id
and checks if the current user is allowed to retrieve the data returned by `get` (that is, they have the same company id):

```js
todoService.after({
  find: function (hook, next) {
    // Manually filter the find results
    hook.result = _.filter(hook.result, function (current) {
      return current.companyId === params.user.companyId;
    });

    next();
  },

  get: function (hook, next) {
    if (hook.result.companyId !== hook.params.user.companyId) {
      return next(new Error('You are not authorized to access this information'));
    }

    next();
  }
});
```

### As service properties

You can also add `before` and `after` hooks to your initial service object right away by setting the `before` and
`after` properties to the hook object. The following example has the same effect as the previous examples:

```js
var TodoService = {
	todos: [],

	get: function (id, params, callback) {
		for (var i = 0; i < this.todos.length; i++) {
			if (this.todos[i].id === id) {
				return callback(null, this.todos[i]);
			}
		}

		callback(new Error('Todo not found'));
	},

	// Return all todos from this service
	find: function (params, callback) {
		callback(null, this.todos);
	},

	// Create a new Todo with the given data
	create: function (data, params, callback) {
		data.id = this.todos.length;
		this.todos.push(data);

		callback(null, data);
	},

	before: {
		find: function (hook, next) {
			if (!hook.params.user) {
				return next(new Error('You are not logged in'));
			}

			next();
		},

		create: function (hook, next) {
			hook.data.createdAt = new Date();

			next();
			// Or
			next(null, hook);
		}
	},

	after: {
		find: function (hook, next) {
			// Manually filter the find results
			hook.result = _.filter(hook.result, function (current) {
				return current.companyId === params.user.companyId;
			});

			next();
		},

		get: function (hook, next) {
			if (hook.result.companyId !== hook.params.user.companyId) {
				return next(new Error('You are not authorized to access this information'));
			}

			next();
		}
	}
}
```

## Changelog

__0.3.0__

- Allows hooks to return a promise ([#3](https://github.com/feathersjs/feathers-hooks/issues/3), [#4](https://github.com/feathersjs/feathers-hooks/issues/4))

__0.2.0__

- API change to use hook objects instead of function parameters ([#1](https://github.com/feathersjs/feathers-hooks/issues/1))

__0.1.0__

- Initial release

## Author

- [David Luecke](https://github.com/daffl)

## License

Copyright (c) 2014 David Luecke

Licensed under the [MIT license](LICENSE).
