import { addHookMethod, processHooks } from './commons';

export default function(service) {
  if(typeof service.mixin !== 'function') {
    return;
  }

  const methods = this.methods;
  const old = service.after;

  addHookMethod(service, 'after', methods);

  const mixin = {};

  methods.forEach(method => {
    if(typeof service[method] !== 'function') {
      return;
    }

    mixin[method] = function() {
      const originalCallback = arguments[arguments.length - 1];

      // Call the _super method which will return the `before` hook object
      return this._super.apply(this, arguments)
        // Make a copy of hookObject from `before` hooks and update type
        .then(hookObject => Object.assign({}, hookObject, { type: 'after' }))
        // Run through all `after` hooks
        .then(processHooks.bind(this, this.__afterHooks[method]))
        // Convert the results and call the original callback if available
        .then(hookObject => {
          const callback = hookObject.callback || originalCallback;

          if(typeof callback === 'function') {
            hookObject.callback(null, hookObject.result);
          }

          return hookObject.result;
        }).catch(error => {
          const callback = (error && error.hook && error.hook.callback) || originalCallback;

          if(typeof callback === 'function') {
            callback(error);
          }

          throw error;
        });
    };
  });

  service.mixin(mixin);

  if(old) {
    service.after(old);
  }
}
