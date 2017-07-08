/* global Class */
type StringHistogram = { [s : string] : number };

import type { Extension } from '../extendable.js';

export default class StringDeduplicationOptimisation implements Extension<string, number, Array<string>> {
  stringHist : StringHistogram
  stringLUT : (Array<string> | void)

  constructor() {
    this.stringHist = Object.create(null);
  }

  detector(x : any) : boolean {
    if (typeof x === 'string') {
      this.stringHist[x] = (this.stringHist[x] || 0) + 1;
      return true;
    }
    return false;
  }

  serialiser(s : string) : number {
    if (this.stringLUT == null) {
      this.generateStringLUT();
    }
    return ((this.stringLUT : any) : Array<string>).indexOf(s);
  }

  deserialiser(x : number, memo : Array<string>) : string {
    return memo[x];
  }

  memo(): Array<string> {
    return this.stringLUT || [];
  }

  generateStringLUT(): void {
    this.stringLUT = Object.keys(this.stringHist)
      .filter(key => this.stringHist[key] >= 2)
      // [key, expected savings]
      .map(key => [key, ((key.length + 1) * this.stringHist[key]) - (key.length + 1 + this.stringHist[key])])
      .sort((e1, e2) => e2[1] - e1[1])
      .map(elt => elt[0]);
  }
}

