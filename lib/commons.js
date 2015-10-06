'use strict';

var _ = require('lodash');
var utils = require('feathers-commons').hooks;

/**
 * Creates a new hook function for the execution chain.
 *
 * @param {Function} hook The hook function
 * @param {Function} prev The previous hook method in the chain
 * @returns {Function}
 */
exports.makeHookFn = function(hook, prev) {
  return function(hookObject) {
    // The callback for the hook
    var hookCallback = function(error, newHookObject) {
      var currentHook = newHookObject || hookObject;

      // Call the callback with the result we set in `newCallback`
      if(error) {
        // Call the old callback with the hook error
        return currentHook.callback(error);
      }

      prev.call(this, currentHook);
    }.bind(this);

    var promise = hook.call(this, hookObject, hookCallback);

    if(typeof promise !== 'undefined' && typeof promise.then === 'function') {
      promise.then(function() {
        hookCallback();
      }, function(error) {
        hookCallback(error);
      });
    }

    return promise;
  };
};

/**
 * Returns the main mixin function for the given type.
 *
 * @param {String} type The type of the hook (currently `before` and `after`)
 * @param {Function} getMixin A function that returns the actual
 * mixin function.
 * @param {Function} addHooks A callback that adds the hooks
 * @returns {Function}
 */
exports.createMixin = function(type, getMixin, addHooks) {
  return function(service) {
    if(!_.isFunction(service.mixin)) {
      return;
    }

    var app = this;
    var hookProp = '__' + type;
    var methods = app.methods;
    var old = service[type];

    var mixin = {};

    mixin[type] = function(obj) {
      if(!this[hookProp]) {
        this[hookProp] = {};
        _.each(methods, function(method) {
          this[hookProp][method] = [];
        }.bind(this));
      }

      _.each(methods, addHooks.bind(this, utils.convertHookData(obj)));

      return this;
    };

    _.each(methods, function(method) {
      if(typeof service[method] !== 'function') {
        return;
      }

      mixin[method] = getMixin(method);
    });

    service.mixin(mixin);

    if(old) {
      service[type](old);
    }
  };
};
