import { hooks as utils } from 'feathers-commons';

/**
 * Creates a new hook function for the execution chain.
 *
 * @param {Function} hook The hook function
 * @param {Function} prev The previous hook method in the chain
 * @returns {Function}
 */
export function makeHookFn(hook, prev) {
  return function(hookObject) {
    // The callback for the hook
    const hookCallback = (error, newHookObject) => {
      const currentHook = newHookObject || hookObject;

      // Call the callback with the result we set in `newCallback`
      if(error) {
        // Call the old callback with the hook error
        return currentHook.callback(error);
      }

      prev.call(this, currentHook);
    };

    const promise = hook.call(this, hookObject, hookCallback);

    if(typeof promise !== 'undefined' && typeof promise.then === 'function') {
      promise.then(function() {
        hookCallback();
      }, hookCallback);
    }

    return promise;
  };
}

/**
 * Returns the main mixin function for the given type.
 *
 * @param {String} type The type of the hook (currently `before` and `after`)
 * @param {Function} getMixin A function that returns the actual
 * mixin function.
 * @param {Function} addHooks A callback that adds the hooks
 * @returns {Function}
 */
export function createMixin(type, getMixin, addHooks) {
  return function(service) {
    if(typeof service.mixin !== 'function') {
      return;
    }

    const app = this;
    const hookProp = '__' + type;
    const methods = app.methods;
    const old = service[type];

    const mixin = {};

    mixin[type] = function(obj) {
      if(!this[hookProp]) {
        this[hookProp] = {};
        methods.forEach(method => this[hookProp][method] = []);
      }

      methods.forEach(addHooks.bind(this, utils.convertHookData(obj)));

      return this;
    };

    methods.forEach(method => {
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
}
