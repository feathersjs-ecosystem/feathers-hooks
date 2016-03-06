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

## Changelog
__1.4.0__
- Fixes bug where events were getting dispatched before all the _after_ hooks finished.

__1.3.0__
- adding `toLowerCase` hook
- `remove` hook now only runs if `hook.params` is set

__1.2.0__
- `remove` hook now supports a callback function to conditionally run it.

__1.1.0__
- Moving bundled hooks top level

__1.0.0__

- Make `app` available inside the `hook` object ([#34](https://github.com/feathersjs/feathers-hooks/pull/34))
- Added remove and disable common hook ([#33](https://github.com/feathersjs/feathers-hooks/pull/33))
- Hooks use promises and promise chains ([#29](https://github.com/feathersjs/feathers-hooks/pull/29))

__0.6.0__

- Prevent next from being called multiple times ([#27](https://github.com/feathersjs/feathers-hooks/pull/27))
- Migrate to ES6 and new plugin infrastructure ([#26](https://github.com/feathersjs/feathers-hooks/pull/26))

__0.5.0__

- Make sure hooks and service methods keep their context ([#17](https://github.com/feathersjs/feathers-hooks/issues/17))
- Refactoring to fix hook execution order and all-hooks ([#16](https://github.com/feathersjs/feathers-hooks/issues/16))
- Arrays of Hooks are running in reverse order ([#13](https://github.com/feathersjs/feathers-hooks/issues/13))
- Before all and after all hooks ([#11](https://github.com/feathersjs/feathers-hooks/issues/11))
- Better check for .makeArguments id ([#15](https://github.com/feathersjs/feathers-hooks/issues/15))
- Remove Feathers peer dependency ([#12](https://github.com/feathersjs/feathers-hooks/issues/12))

__0.4.0__

- Allows hooks to be chained in an array ([#2](https://github.com/feathersjs/feathers-hooks/issues/2))

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
