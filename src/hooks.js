import before from './before';
import after from './after';

export default function() {
  return function() {
    this.mixins.push(before(this));
    this.mixins.push(after);
  };
}
