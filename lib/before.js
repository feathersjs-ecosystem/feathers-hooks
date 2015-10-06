'use strict';

var commons = require('./commons');
var utils = require('feathers-commons').hooks;

/**
 * Return the hook mixin method for the given name.
 *
 * @param {String} method The service method name
 * @returns {Function}
 */
var getMixin = function (method) {
  return function() {
    var _super = this._super;

    if(!this.__before || !this.__before[method].length) {
      return _super.apply(this, arguments);
    }

    // Make a copy of our hooks
    var hooks = this.__before[method].slice();
    // The chained function
    var fn = function(hookObject) {
      return _super.apply(this, utils.makeArguments(hookObject));
    };

    while(hooks.length) {
      fn = commons.makeHookFn(hooks.pop(), fn);
    }

    return fn.call(this, utils.hookObject(method, 'before', arguments));
  };
};

var addHooks = function(hooks, method) {
  var myHooks = this.__before[method];

  if(hooks.all) {
    myHooks.push.apply(myHooks, hooks.all);
  }

  if(hooks[method]) {
    myHooks.push.apply(myHooks, hooks[method]);
  }
};

module.exports = commons.createMixin('before', getMixin, addHooks);
