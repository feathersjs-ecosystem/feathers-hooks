import makeDebug from 'debug';
import { hooks as utils } from 'feathers-commons';
import { makeHookFn, createMixin } from './commons';

const debug = makeDebug('feathers-hooks:before');

/**
 * Return the hook mixin method for the given name.
 *
 * @param {String} method The service method name
 * @returns {Function}
 */
function getMixin(method) {
  return function() {
    const _super = this._super;

    if(!this.__before || !this.__before[method].length) {
      return _super.apply(this, arguments);
    }

    // Make a copy of our hooks
    const hooks = this.__before[method].slice();
    debug(`Running ${hooks.length} before hooks for method ${method}`);

    // The chained function
    let fn = function(hookObject) {
      return _super.apply(this, utils.makeArguments(hookObject));
    };

    while(hooks.length) {
      fn = makeHookFn(hooks.pop(), fn);
    }

    return fn.call(this, utils.hookObject(method, 'before', arguments));
  };
}

function addHooks(hooks, method) {
  const myHooks = this.__before[method];

  if(hooks.all) {
    myHooks.push.apply(myHooks, hooks.all);
  }

  if(hooks[method]) {
    myHooks.push.apply(myHooks, hooks[method]);
  }
}

export default createMixin('before', getMixin, addHooks);
