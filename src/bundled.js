const errors = require('feathers-errors').errors;

export function lowerCase(... fields) {
  const lowerCaseFields = data => {
    for(let field of fields) {
      if(data[field]) {
        if(typeof data[field] !== 'string') {
          throw new errors.BadRequest('Expected string');
        } else {
          data[field] = data[field].toLowerCase();
        }
      }
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

export function removeQuery(... fields) {
  const removeQueries = data => {
    for(let field of fields) {
      data[field] = undefined;
      delete data[field];
    }
  };

  const callback = typeof fields[fields.length - 1] === 'function' ?
    fields.pop() : () => true;

  return function(hook) {
    if (hook.type === 'after') {
      throw new errors.GeneralError(`Provider '${hook.params.provider}' can not remove query params on after hook.`);
    }
    const result = hook.params.query;
    const next = condition => {
      if(result && condition) {
        removeQueries(result);
      }
      return hook;
    };

    const check = callback(hook);

    return check && typeof check.then === 'function' ?
      check.then(next) : next(check);
  };
}

export function pluckQuery(... fields) {
  const pluckQueries = data => {
    for(let key of Object.keys(data)) {
      if(fields.indexOf(key) === -1) {
        data[key] = undefined;
        delete data[key];
      }
    }
  };

  const callback = typeof fields[fields.length - 1] === 'function' ?
    fields.pop() : () => true;

  return function(hook) {
    if (hook.type === 'after') {
      throw new errors.GeneralError(`Provider '${hook.params.provider}' can not pluck query params on after hook.`);
    }
    const result = hook.params.query;
    const next = condition => {
      if(result && condition) {
        pluckQueries(result);
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
      if (result && condition) {
        if (Array.isArray(result)) {
          result.forEach(removeFields);
        } else {
          removeFields(result);

          if (result.data) {
            if (Array.isArray(result.data)) {
              result.data.forEach(removeFields);
            } else {
              removeFields(result.data);
            }
          }
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

export function populate(target, options) {
  options = Object.assign({}, options);

  if (!options.service) {
    throw new Error('You need to provide a service');
  }

  const field = options.field || target;

  return function(hook) {
    function populate(item) {
      if(!item[field]) {
        return Promise.resolve(item);
      }

      // Find by the field value by default or a custom query
      const id = item[field];

      // If it's a mongoose model then
      if (typeof item.toObject === 'function') {
        item = item.toObject(options);
      }
      // If it's a Sequelize model
      else if (typeof item.toJSON === 'function') {
        item = item.toJSON(options);
      }
      // Remove any query from params as it's not related
      const params = Object.assign({}, params, { query: undefined });
      // If the relationship is an array of ids, fetch and resolve an object for each, otherwise just fetch the object.
      const promise = Array.isArray(id) ? Promise.all(id.map(objectID => hook.app.service(options.service).get(objectID, params))) : hook.app.service(options.service).get(id, params);
      return promise.then(relatedItem => {
          if(relatedItem) {
            item[target] = relatedItem;
          }
          return item;
        });
    }

    if(hook.type === 'after') {
      const isPaginated = (hook.method === 'find' && hook.result.data);
      const data = isPaginated ? hook.result.data : hook.result;

      if (Array.isArray(data)) {
        return Promise.all(data.map(populate)).then(results => {
          if(isPaginated) {
            hook.result.data = results;
          } else {
            hook.result = results;
          }

          return hook;
        });
      }

      // Handle single objects.
      return populate(hook.result).then(item => {
        hook.result = item;
        return hook;
      });
    }
  };
}
