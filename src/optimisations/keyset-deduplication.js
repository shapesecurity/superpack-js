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

export default class KeysetDeduplicationOptimisation implements Extension<{}, Array<any>, Array<Keyset>> {
  keysets : Array<Keyset>
  frequencies : Array<number>
  finalisedKeysets : ?Array<Keyset>

  constructor() {
    this.keysets = [];
    this.frequencies = [];
  }

  isCandidate(x : any) : boolean {
    // WARN: this condition is equivalent to reaching the final case in the
    // encoder where the value is treates as a record
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

  shouldSerialise(x : {}) : boolean {
    let finalisedKeysets = this.finalisedKeysets;
    if (finalisedKeysets == null) {
      finalisedKeysets = this.finaliseKeysets();
      this.finalisedKeysets = finalisedKeysets;
    }
    let keys = Object.keys(x).sort();
    return this.frequencies[this.findKeysetIndex(keys, finalisedKeysets)] > 1;
  }

  serialise(x : {}) : Array<any> {
    let finalisedKeysets = this.finalisedKeysets;
    if (finalisedKeysets == null) {
      finalisedKeysets = this.finaliseKeysets();
      this.finalisedKeysets = finalisedKeysets;
    }
    let keys = Object.keys(x).sort();
    let index = this.findKeysetIndex(keys, finalisedKeysets);
    return [index, ...keys.map(k => x[k])];
  }

  deserialise(x : Array<any>, memo : Array<Keyset>) : {} {
    let keysetIndex = (x.shift() : number);
    return memo[keysetIndex].reduce((m, k, i) => {
      m[k] = x[i];
      return m;
    }, {});
  }

  memo(): Array<Keyset> {
    return this.finalisedKeysets || [];
  }

  finaliseKeysets() : Array<Keyset> {
    return [].concat(...this.keysets.map((ks, i) => this.frequencies[i] > 1 ? [ks] : []));
  }

  // WARN: keys are sorted
  findKeysetIndex(keys : Keyset, keysets : Array<Keyset>) {
    return findIndex(keysets, a => isSortedArrayOfThingsSameAsSortedArrayOfThings(a, keys));
  }
}
