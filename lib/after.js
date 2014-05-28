var _ = require('lodash');

module.exports = function (service) {
  if (typeof service.mixin !== 'function') {
    return;
  }

  var app = this;
  var oldAfter = service.after;

  service.mixin({
    after: function (obj) {
      var mixin = {};

      _.each(app.methods, function (name) {
        var hook = obj[name];
        if (hook) {
          mixin[name] = function () {
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
        }
      });

      this.mixin(mixin);
    }
  });

  if(oldAfter) {
    service.after(oldAfter);
  }
};
