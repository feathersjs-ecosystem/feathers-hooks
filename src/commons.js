export function isHookObject(hookObject) {
  return typeof hookObject === 'object' &&
    typeof hookObject.method === 'string' &&
    typeof hookObject.type === 'string';
}

export function processHooks(hooks, initialHookObject) {
  let hookObject = initialHookObject;
  let updateCurrentHook = current => {
    if(current) {
      if(!isHookObject(current)) {
        throw new Error(`${hookObject.type} hook for '${hookObject.method}' method returned invalid hook object`);
      }

      hookObject = current;
    }

    return hookObject;
  };
  let promise = Promise.resolve(hookObject);

  // Go through all hooks and chain them into our promise
  hooks.forEach(fn => {
    const hook = fn.bind(this);

    if(hook.length === 2) { // function(hook, next)
      promise = promise.then(hookObject => {
        return new Promise((resolve, reject) => {
          hook(hookObject, (error, result) =>
            error ? reject(error) : resolve(result));
        });
      });
    } else { // function(hook)
      promise = promise.then(hook);
    }

    // Use the returned hook object or the old one
    promise = promise.then(updateCurrentHook);
  });

  return promise.catch(error => {
    // Add the hook information to any errors
    error.hook = hookObject;
    throw error;
  });
}

export function addHookTypes(service, methods, ... types) {
  types.forEach(type => {
    // Initialize properties where hook functions are stored
    service.__hooks[type] = {};

    methods.forEach(method => {
      if(typeof service[method] === 'function') {
        service.__hooks[type][method] = [];
      }
    });
  });
}
