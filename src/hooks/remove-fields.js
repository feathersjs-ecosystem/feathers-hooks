/**
 * Remove provided field or fields from response.
 * @param {String or Array} fieldsToRemove a field name String or array
 *                   of field name Strings to remove from the results.
 *
 * after
 * all, find, get, create, update, patch, remove
 */
const removeFields = function(fieldsToRemove){
  if (!fieldsToRemove) {
    throw new Error('You must pass a string or array of strings to the "removeFields" hook.');
  }

  if (!Array.isArray(fieldsToRemove)) {
    fieldsToRemove = [fieldsToRemove];
  }

  fieldsToRemove.forEach(field => {
    if (typeof field !== 'string') {
      throw new Error('"removeFields" hook: field names must be strings.');
    }
  });

  return function (hook, next) {
    // Skip removing fields if it's flagged as internal.
    if (!hook.params.internal) {
      if (typeof hook.result === 'object') {

        var removeFields = function(data){
          for (var i = 0; i < fieldsToRemove.length; i++) {
            data[fieldsToRemove[i]] = undefined; // for mongoose
            delete data[fieldsToRemove[i]];
          }
        };

        // Handle arrays of objects.
        if (hook.result.length) {
          for (var i = 0; i < hook.result.length; i++) {
            removeFields(hook.result[i]);
          }
        // Handle a single object.
        } else {
          removeFields(hook.result);
        }
      }
    }
    return next();
  };
};

export default removeFields;
