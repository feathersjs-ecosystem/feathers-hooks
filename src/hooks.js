if(!global._babelPolyfill) { require('babel-polyfill'); }

import before from './before';
import after from './after';

export default function() {
  return function() {
    this.mixins.push(before);
    this.mixins.push(after);
  };
}
