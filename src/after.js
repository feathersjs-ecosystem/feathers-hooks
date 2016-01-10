import { hooks as utils } from 'feathers-commons';
import { makeHookFn, createMixin } from './commons';

/**
 * Return the hook mixin method for the given name.
 *
 * @param {String} method The service method name
 * @returns {Function}
 */
function getMixin(method) {
  return function() {
    var _super = this._super;

    if(!this.__after || !this.__after[method].length) {
      return _super.apply(this, arguments);
    }

    const args = Array.from(arguments);
    const hookObject = utils.hookObject(method, 'after', args);
    // Make a copy of our hooks
    const hooks = this.__after[method].slice();

    // Remove the old callback and replace with the new callback that runs the hook
    args.pop();
    // The new _super method callback
    args.push(function(error, result) {
      if(error) {
        // Call the old callback with the error
        return hookObject.callback(error);
      }

      var fn = function(hookObject) {
        return hookObject.callback(null, hookObject.result);
      };

      // Set hookObject result
      hookObject.result = result;

      while(hooks.length) {
        fn = makeHookFn(hooks.pop(), fn);
      }

      return fn.call(this, hookObject);
    }.bind(this));


    return _super.apply(this, args);
  };
}

function addHooks(hooks, method) {
  const myHooks = this.__after[method];

  if(hooks[method]) {
    myHooks.push.apply(myHooks, hooks[method]);
  }

  if(hooks.all) {
    myHooks.push.apply(myHooks, hooks.all);
  }
}

module.exports = createMixin('after', getMixin, addHooks);
