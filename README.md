# Feathers Hooks

[![Build Status](https://travis-ci.org/feathersjs/feathers-hooks.png?branch=master)](https://travis-ci.org/feathersjs/feathers-hooks)

> Middleware for Feathers service methods

## Documentation

Please refer to the [Feathers hooks documentation](http://docs.feathersjs.com/hooks/readme.html) for more details on:

- The philosophy behind hooks
- How you can use hooks
- How you can chain hooks using Promises
- Params that are available in hooks
- Hooks that are bundled with feathers and feathers plugins

## Quick start

`feathers-hooks` allows you to register composable middleware functions **before** or **after** a Feathers service method executes. This makes it easy to decouple things like authorization and pre- or post processing from your service logic.

To install from [npm](https://www.npmjs.com/package/feathers-hooks), run:

```bash
$ npm install feathers-hooks --save
```

Then, to use the plugin in your Feathers app:

```javascript
const feathers = require('feathers');
const hooks = require('feathers-hooks');

const app = feathers().configure(hooks());
```

Then, you can register a hook for a service:

```javascript
// User service
const service = require('feathers-memory');

module.exports = function(){
  const app = this;

  let myHook = function(options) {
    return function(hook) {
      console.log('My custom hook ran!');
    }
  }

  // Initialize our service
  app.use('/users', service());

  // Get our initialize service to that we can bind hooks
  const userService = app.service('/users');

  // Set up our before hook
  userService.before({
    find: [ myHook() ]
  });
}
```

## Examples

The repository contains the following examples:

- [authorization.js](https://github.com/feathersjs/feathers-hooks/blob/master/examples/authorization.js) - A simple demo showing how to use hooks for authorization (and post-processing the results) where the user is set via a `?user=username` query parameter.
- [timestamp.js](https://github.com/feathersjs/feathers-hooks/blob/master/examples/timestamp.js) - A demo that adds a `createdAt` and `updatedAt` timestamp when creating or updating a Todo using hooks.

## License

Copyright (c) 2014 [Feathers contributors](https://github.com/feathersjs/feathers-hooks/graphs/contributors)

Licensed under the [MIT license](LICENSE).
