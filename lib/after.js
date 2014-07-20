var _ = require('lodash');
var utils = require('./utils');

module.exports = function(service) {
  if(!_.isFunction(service.mixin)) {
    return;
  }

  var oldAfter = service.after;
  var app = this;

  service.mixin({
    after: function(obj) {
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
            var args = _.toArray(arguments);
            var hookObject = utils.hookObject(name, args);
            // The callback for the after hook
            var hookCallback = function(error, newHookObject) {
              // Call the callback with the result we set in `newCallback`
              var hook = newHookObject || hookObject;

              if(error) {
                // Call the old callback with the hook error
                return hook.callback(error);
              }

              hook.callback(null, hook.result);
            };
            // The new _super method callback
            var newCallback = function(error, result) {
              if(error) {
                // Call the old callback with the error
                return hookObject.callback(error);
              }

              // Set hookObject result
              hookObject.result = result;

              // Call the hook object
              var promise = hook.call(self, hookObject, hookCallback);
              if(typeof promise !== 'undefined' && typeof promise.then === 'function') {
                promise.then(function() {
                  hookCallback();
                }, function(error) {
                  hookCallback(error);
                });
              }
            };

            hookObject.type = 'after';

            // Remove the old callback and replace with the new callback that runs the hook
            args.pop();
            args.push(newCallback);

            // Call super method
            return this._super.apply(this, args);
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

  if(oldAfter) {
    service.after(oldAfter);
  }
};
