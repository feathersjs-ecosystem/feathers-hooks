const errors = require('feathers-errors').errors;

export function lowerCase(... fields) {
  const lowerCaseFields = data => {
    for(let field of fields) {
      data[field] = data[field].toLowerCase();
    }
  };

  const callback = typeof fields[fields.length - 1] === 'function' ?
    fields.pop() : () => true;

  return function(hook) {
    const result = hook.type === 'before' ? hook.data : hook.result;
    const next = condition => {
      if(result && condition) {
        if(hook.method === 'find' || Array.isArray(result)) {
          // data.data if the find method is paginated
          (result.data || result).forEach(lowerCaseFields);
        } else {
          lowerCaseFields(result);
        }
      }
      return hook;
    };

    const check = callback(hook);

    return check && typeof check.then === 'function' ?
      check.then(next) : next(check);
  };
}

export function remove(... fields) {
  const removeFields = data => {
    for(let field of fields) {
      data[field] = undefined;
      delete data[field];
    }
  };
  
  const callback = typeof fields[fields.length - 1] === 'function' ?
    fields.pop() : (hook) => !!hook.params.provider;

  return function(hook) {
    const result = hook.type === 'before' ? hook.data : hook.result;
    const next = condition => {
      if(result && condition) {
        if(hook.method === 'find' || Array.isArray(result)) {
          // data.data if the find method is paginated
          (result.data || result).forEach(removeFields);
        } else {
          removeFields(result);
        }
      }
      return hook;
    };

    const check = callback(hook);

    return check && typeof check.then === 'function' ?
      check.then(next) : next(check);
  };
}

export function pluck(... fields) {
  const pluckFields = data => {
    for(let key of Object.keys(data)) {
      if(fields.indexOf(key) === -1) {
        data[key] = undefined;
        delete data[key];
      }
    }
  };
  
  const callback = typeof fields[fields.length - 1] === 'function' ?
    fields.pop() : (hook) => !!hook.params.provider;

  return function(hook) {
    const result = hook.type === 'before' ? hook.data : hook.result;
    const next = condition => {
      if(result && condition) {
        if(hook.method === 'find' || Array.isArray(result)) {
          // data.data if the find method is paginated
          (result.data || result).forEach(pluckFields);
        } else {
          pluckFields(result);
        }
      }
      return hook;
    };

    const check = callback(hook);

    return check && typeof check.then === 'function' ?
      check.then(next) : next(check);
  };
}

export function disable(realm, ... args) {
  if(!realm) {
    return function(hook) {
      throw new errors.MethodNotAllowed(`Calling '${hook.method}' not allowed.`);
    };
  } else if(typeof realm === 'function') {
    return function(hook) {
      const result = realm(hook);
      const next = check => {
        if(!check) {
          throw new errors.MethodNotAllowed(`Calling '${hook.method}' not allowed.`);
        }
      };

      if(result && typeof result.then === 'function') {
        return result.then(next);
      }

      next(result);
    };
  } else {
    const providers = [ realm ].concat(args);

    return function(hook) {
      const provider = hook.params.provider;

      if((realm === 'external' && provider) || providers.indexOf(provider) !== -1) {
        throw new errors.MethodNotAllowed(`Provider '${hook.params.provider}' can not call '${hook.method}'`);
      }
    };
  }
}
