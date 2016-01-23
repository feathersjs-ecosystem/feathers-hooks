import { hooks as utils } from 'feathers-commons';
import { addHookMethod, processHooks } from './commons';

export default function(app) {
  return function(service){
    if(typeof service.mixin !== 'function') {
      return;
    }

    const methods = this.methods;
    const old = service.before;
    const mixin = {};

    addHookMethod(service, 'before', methods);

    methods.forEach(method => {
      if(typeof service[method] !== 'function') {
        return;
      }

      mixin[method] = function() {
        const _super = this._super.bind(this);
        const hookObject = utils.hookObject(method, 'before', arguments);
        const hooks = this.__beforeHooks[method];

        hookObject.app = app;

        // Run all hooks
        let promise = processHooks.call(this, hooks, hookObject);

        // Then call the original method
        return promise.then(hookObject => {
          return new Promise((resolve, reject) => {
            const args = utils.makeArguments(hookObject);

            // We replace the callback with resolving the promise
            args.splice(args.length - 1, 1, (error, result) => {
              if(error) {
                reject(error);
              } else {
                hookObject.result = result;
                resolve(hookObject);
              }
            });

            _super(... args);
          });
        });
      };
    });

    service.mixin(mixin);

    if(old) {
      service.before(old);
    }
  };
}
