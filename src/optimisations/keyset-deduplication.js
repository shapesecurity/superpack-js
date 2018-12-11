/* global ArrayBuffer */
import type { Extension } from '../extendable.js';

type Keyset = Array<string>;

function findIndex(a, predicate) {
  for (let i = 0; i < a.length; ++i) {
    if (predicate(a[i])) return i;
  }
  return -1;
}

function isSortedArrayOfThingsSameAsSortedArrayOfThings(a, b) {
  return a.length === b.length && a.every((c, i) => b[i] === c);
}

export function withOmittedKeysets({ omittedKeysets = [] } : { omittedKeysets : Array<Keyset>} = {}) {
  return class extends KeysetDeduplicationOptimisation {
    constructor() {
      super(omittedKeysets);
    }
  }
}

export default class KeysetDeduplicationOptimisation implements Extension<{}, Array<any>, Array<Keyset>> {
  keysets : Array<Keyset>
  frequencies : Array<number>
  omittedKeysetCount: number

  constructor({ omittedKeysets = [] } : { omittedKeysets : Array<Keyset>} = {}) {
    this.keysets = [].slice.call(omittedKeysets);
    this.frequencies = [];
    this.omittedKeysetCount = omittedKeysets.length;
  }

  shouldApplyRecursively() : boolean {
    return true;
  }

  isCandidate(x : any) : boolean {
    // WARN: this condition is equivalent to reaching the final case in the
    // encoder where the value is treated as a record
    if (
      typeof x === 'object' && x != null &&
      {}.toString.call(x) !== '[object Date]' &&
      !(typeof ArrayBuffer !== 'undefined' && x instanceof ArrayBuffer) &&
      !Array.isArray(x)
    ) {
      let keys = Object.keys(x).sort();
      let index = this.findKeysetIndex(keys, this.keysets);
      if (index < 0) {
        this.frequencies.push(1);
        index = this.keysets.push(keys) - 1;
      } else {
        ++this.frequencies[index];
      }
      return true;
    }
    return false;
  }

  serialise(x : {}) : Array<any> {
    let keys = Object.keys(x).sort();
    let index = this.findKeysetIndex(keys, this.keysets);
    return [index, ...keys.map(k => x[k])];
  }

  deserialise(x : Array<any>, memo : Array<Keyset>) : {} {
    let keysetIndex = (x.shift() : number);
    let keyset;
    if (keysetIndex < this.omittedKeysetCount) {
      keyset = this.keysets[keysetIndex];
    } else {
      keyset = memo[keysetIndex - this.omittedKeysetCount];
    }
    return keyset.reduce((m, k, i) => {
      m[k] = x[i];
      return m;
    }, {});
  }

  memo(): Array<Keyset> {
    return this.keysets.slice(this.omittedKeysetCount);
  }

  // WARN: keys are sorted
  findKeysetIndex(keys : Keyset, keysets : Array<Keyset>) {
    return findIndex(keysets, a => isSortedArrayOfThingsSameAsSortedArrayOfThings(a, keys));
  }
}
