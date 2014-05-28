var _ = require('lodash');

module.exports = function (service) {
  if (typeof service.mixin !== 'function') {
    return;
  }

  var oldAfter = service.after;
  var app = this;

  service.mixin({
    after: function (obj) {
      var mixin = _.transform(obj, function(result, hook, name) {
        // Don't mix in if it is not a service method
        if(app.methods.indexOf(name) === -1) {
          return;
        }

        result[name] = function () {
          var self = this;
          var args = _.toArray(arguments);
          var oldCallback = args.pop();
          var newCallback = function (error, data) {
            if (error) {
              return oldCallback(error);
            }

            var hookArgs = args;

            // Add data and the oldCallback before running the hook
            hookArgs.unshift(data);
            hookArgs.push(oldCallback);

            hook.apply(self, hookArgs);
          };

          return this._super.apply(this, args.concat(newCallback));
        };
      });

      this.mixin(mixin);
    }
  });

  if(oldAfter) {
    service.after(oldAfter);
  }
};
