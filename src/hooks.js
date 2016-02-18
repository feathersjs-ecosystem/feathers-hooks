import before from './before';
import after from './after';
import * as hooks from './bundled';

function configure() {
  return function() {
    this.mixins.push(before(this));
    this.mixins.push(after);
  };
}


configure.remove = hooks.remove;
configure.disable = hooks.disable;

export default configure;
