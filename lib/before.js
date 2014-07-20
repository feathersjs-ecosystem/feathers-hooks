

var _ = require('lodash');
var utils = require('./utils');

module.exports = function(service) {
  if (!_.isFunction(service.mixin)) {
    return;
  }

  var app = this;
  var oldBefore = service.before;

  service.mixin({
    before: function(obj) {
      var mixin = _.transform(obj, function(result, hooks, name) {
        // Don't mix in if it is not a service method
        if(app.methods.indexOf(name) === -1) {
          return;
        }

        if (!_.isArray(hooks)){
          hooks = [hooks];
        }

        result[name] = [];

        _.each(hooks, function(hook){
          var fn = function() {
            var self = this;
            // The original method
            var _super = this._super;
            // The hook data object
            var hookObject = utils.hookObject(name, arguments);
            // The callback for the hook
            var hookCallback = function(error, newHookObject) {
              if(error) {
                // We got an error
                return hookObject.callback(error);
              }

              // Call the _super method. We either use the original hook object
              // to create the arguments or the new one passed to the hook callback
              _super.apply(self, utils.makeArguments(newHookObject || hookObject));
            };

            hookObject.type = 'before';

            var promise = hook.call(self, hookObject, hookCallback);
            if(typeof promise !== 'undefined' && typeof promise.then === 'function') {
              promise.then(function() {
                hookCallback();
              }, function(error) {
                hookCallback(error);
              });
            }
          };

          result[name].push(fn);
        });
      });
       
      var self = this;

      _.each(mixin, function(hooks, method){
        _.each(hooks, function(hook){
          var obj = {};
          obj[method] = hook;
          self.mixin(obj);
        });
      });

      return this;
    }
  });

  if(oldBefore) {
    service.before(oldBefore);
  }
};
