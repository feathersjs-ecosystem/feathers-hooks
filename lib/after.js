var _ = require('lodash');

module.exports = function (service) {
  if (!(typeof service.mixin === 'function' && service.after)) {
    return;
  }

  var app = this;
  var mixin = {};

  _.each(app.methods, function (name) {
    var hook = service.after && service.after[name];
    if (hook) {
      mixin[name] = function () {
        var self = this;
        // The original method
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

  service.mixin(mixin);
};
