# feathers-hooks [![Build Status](https://travis-ci.org/daffl/feathers-hooks.png?branch=master)](https://travis-ci.org/daffl/feathers-hooks)

> Before and after service method call hooks for easy authorization and processing.

## Getting Started

To install feathers-hooks from [npm](https://www.npmjs.org/), run:

```bash
$ npm install feathers-hooks --save
```

Finally, to use the plugin in your Feathers app:

```javascript
// Require
var feathers = require('feathers');
var plugin = require('feathers-hooks');
// Setup
var app = feathers();
// Use Plugin
app.configure(plugin({ /* configuration */ }));
```

## Using hooks

You can add `before` and `after` hooks for any Feathers service method. This allows, for example,
to check if the user is authorized or even pre- or postprocess parameters and data:

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

## Documentation

See the [docs](docs/).

## Author

- [David Luecke](https://github.com/daffl)

## License

Copyright (c) 2014 David Luecke

Licensed under the [MIT license](LICENSE).