var _ = require('lodash');

module.exports = function (service) {
  if (!(typeof service.mixin === 'function' && service.before)) {
    return;
  }

  var app = this;
  var mixin = {};

  _.each(app.methods, function(name) {
    var hook = service.before && service.before[name];
    if(hook) {
      mixin[name] = function() {
        var self = this;
        // The original method
        var _super = this._super;
        var args = _.toArray(arguments);
        // Store the original callback
        var oldCallback = args.pop();

        // The callback that is being called by the .before hook
        var newCallback = function() {
          var error = arguments[0];

          if(error) {
            // We got an error
            return oldCallback(error);
          }

          // Use either the original arguments or the ones we got from the callback
          var newArguments = arguments.length > 1 ?
            Array.prototype.slice.call(arguments, 1, arguments.length) : args;

          // Call the original method with the old callback added
          _super.apply(self, newArguments.concat(oldCallback));
        };

        hook.apply(self, args.concat(newCallback));
      };
    }
  });

  service.mixin(mixin);
};
