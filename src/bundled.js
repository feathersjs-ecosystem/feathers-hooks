const errors = require('feathers-errors').errors;

export function remove(... fields) {
  const removeFields = data => {
    for(let field of fields) {
      data[field] = undefined;
      delete data[field];
    }
  };
  
  return function(hook) {
    let result = hook.type === 'before' ? hook.data : hook.result;
    
    if(result) {
      if(hook.method === 'find' || Array.isArray(result)) {
        // data.data if the find method is paginated
        (result.data || result).forEach(removeFields);
      } else {
        removeFields(result);
      }
    }
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