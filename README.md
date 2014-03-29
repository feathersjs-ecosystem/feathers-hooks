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

## Documentation

See the [docs](docs/).

## Author

- [David Luecke](https://github.com/daffl)

## License

Copyright (c) 2014 David Luecke

Licensed under the [MIT license](LICENSE).