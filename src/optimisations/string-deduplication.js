type StringHistogram = { [s : string] : number };

import type { Extension } from '../extendable.js';

export default class StringDeduplicationOptimisation implements Extension<string, number, Array<string>> {
  stringHist : StringHistogram
  stringLUT : (Array<string> | void)

  constructor() {
    this.stringHist = Object.create(null);
  }

  isCandidate(x : any) : boolean {
    if (typeof x === 'string') {
      this.stringHist[x] = (this.stringHist[x] || 0) + 1;
      return true;
    }
    return false;
  }

  shouldSerialise(s : string) : boolean {
    if (this.stringLUT == null) {
      this.generateStringLUT();
    }
    return ((this.stringLUT : any) : Array<string>).indexOf(s) >= 0;
  }

  serialise(s : string) : number {
    if (this.stringLUT == null) {
      this.generateStringLUT();
    }
    return ((this.stringLUT : any) : Array<string>).indexOf(s);
  }

  deserialise(x : number, memo : Array<string>) : string {
    return memo[x];
  }

  memo(): Array<string> {
    return this.stringLUT || [];
  }

  generateStringLUT(): void {
    this.stringLUT = Object.keys(this.stringHist)
      // [str, expected savings]
      .map(str => [str, ((str.length + 1) * this.stringHist[str]) - (str.length + 1 + this.stringHist[str])])
      .filter(([, savings]) => savings > 0)
      .sort(([, savings1], [, savings2]) => savings2 - savings1)
      .map(([str]) => str);
  }
}
