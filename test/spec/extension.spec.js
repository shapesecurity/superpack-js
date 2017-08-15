import { expect } from 'chai';

import SuperPackTranscoder, { encode, decode } from '../../src/index';
import types from '../../src/type-tags';


function getFlags(re) {
  let s = '' + re;
  return s.slice(s.lastIndexOf('/') + 1);
}

describe('extension', function () {
  it('can allow us to express RegExps using the OO interface', function () {
    let transcoder = new SuperPackTranscoder;
    transcoder.extend(
      // extension point
      0,
      class {
        // detect values which require this custom serialisation
        isCandidate(x) { return  x instanceof RegExp; }
        // serialise: return an intermediate value which will be encoded instead
        serialise(r) { return [r.source, getFlags(r)]; }
        // deserialise: from the intermediate value, reconstruct the original value
        deserialise([source, flags]) { return RegExp(source, flags); }
      }
    );

    let encoded = transcoder.encode(/a/i);
    expect(encoded).to.be.eql([
      types.EXTENSION3_BASE,
        types.ARRAY5_BASE | 2,
          types.STR5_BASE | 1, 'a'.charCodeAt(0),
          types.STR5_BASE | 1, 'i'.charCodeAt(0),
    ]);
    let decoded = transcoder.decode(encoded);
    expect(decoded).to.be.an.instanceof(RegExp);
    expect(decoded.source).to.be.equal('a');
    expect(getFlags(decoded)).to.be.equal('i');
  });

  it('can allow us to express RegExps using the functional interface', function () {
    let extensions = {
      0: class {
        // detect values which require this custom serialisation
        isCandidate(x) { return x instanceof RegExp; }
        // serialise: return an intermediate value which will be encoded instead
        serialise(r) { return [r.source, getFlags(r)]; }
        // deserialise: from the intermediate value, reconstruct the original value
        deserialise([source, flags]) { return RegExp(source, flags); }
      },
    };

    let encoded = encode(/a/i, { extensions });
    expect(encoded).to.be.eql([
      types.EXTENSION3_BASE,
        types.ARRAY5_BASE | 2,
          types.STR5_BASE | 1, 'a'.charCodeAt(0),
          types.STR5_BASE | 1, 'i'.charCodeAt(0),
    ]);
    let decoded = decode(encoded, { extensions });
    expect(decoded).to.be.an.instanceof(RegExp);
    expect(decoded.source).to.be.equal('a');
    expect(getFlags(decoded)).to.be.equal('i');
  });

  it('does not recurse infinitely on extensions to numeric values', function () {
    let extensions = {
      0: class {
        // detect values which require this custom serialisation
        isCandidate(x) { return Math.floor(x) === x; }
        // serialise: return an intermediate value which will be encoded instead
        serialise(n) { return '' + (n + 1); }
        // deserialise: from the intermediate value, reconstruct the original value
        deserialise(n) { return parseInt(n) - 1; }
      },
    };

    let encoded = encode(0, { extensions });
    expect(encoded).to.be.eql([
      types.EXTENSION3_BASE,
        types.STR5_BASE | 1, '1'.charCodeAt(0),
    ]);
    let decoded = decode(encoded, { extensions });
    expect(decoded).to.be.equal(0);
  });

  describe('stores a memo and uses it in the decoding process', function () {

    it('can reproduce the string deduplication optimisation and avoids infinite looping', function () {
      let extensions = {
        0: class {
          constructor() {
            this.strings = [];
          }
          isCandidate(x) { return typeof x === 'string'; }
          serialise(s) {
            let i = this.strings.indexOf(s);
            if (i >= 0) return i;
            return this.strings.push(s) - 1;
          }
          deserialise(n, memo) { return memo[n]; }
          memo() { return this.strings; }
        },
      };

      let data = ['a', 'a', 'b', 'c', 'b', 'd'];
      let encoded = encode(data, { extensions });
      expect(encoded).to.be.eql([
        types.ARRAY5_BASE | 4,
          types.STR5_BASE | 1, 'a'.charCodeAt(0),
          types.STR5_BASE | 1, 'b'.charCodeAt(0),
          types.STR5_BASE | 1, 'c'.charCodeAt(0),
          types.STR5_BASE | 1, 'd'.charCodeAt(0),
        types.ARRAY5_BASE | 6,
          types.EXTENSION3_BASE, 0,
          types.EXTENSION3_BASE, 0,
          types.EXTENSION3_BASE, 1,
          types.EXTENSION3_BASE, 2,
          types.EXTENSION3_BASE, 1,
          types.EXTENSION3_BASE, 3,
      ]);
      let decoded = decode(encoded, { extensions });

      expect(decoded).to.be.eql(data);
    });

    it('can represent object identity and circular references', function () {
      let { registerIdentity, extension } = (() => {
        let identities = [];
        return {
          registerIdentity(x) { identities.push(x); },
          extension: class {
            isCandidate(x) { return identities.indexOf(x) >= 0; }
            serialise(o) { return identities.indexOf(o); }
            deserialise(n, memo) { return memo[n]; }
            memo() { return identities; }
          }
        };
      })();

      let extensions = { 0: extension };

      let a = { a: 8 }, b = { b: 9 }, c = { a: a }, d = { a: 4, b: 5, c: 6 };
      let data = [a, a, b, c, b, d];

      registerIdentity(a);
      registerIdentity(d);

      let encoded = encode(data, { extensions });
      expect(encoded).to.be.eql([
        types.ARRAY5_BASE | 2,
          types.MAP,
            types.ARRAY5_BASE | 1,
              types.STR5_BASE | 1, 'a'.charCodeAt(0),
            8,
          types.MAP,
            types.ARRAY5_BASE | 3,
              types.STR5_BASE | 1, 'a'.charCodeAt(0),
              types.STR5_BASE | 1, 'b'.charCodeAt(0),
              types.STR5_BASE | 1, 'c'.charCodeAt(0),
            4,
            5,
            6,
        types.ARRAY5_BASE | 6,
          types.EXTENSION3_BASE, 0,
          types.EXTENSION3_BASE, 0,
          types.MAP,
            types.ARRAY5_BASE | 1,
              types.STR5_BASE | 1, 'b'.charCodeAt(0),
            9,
          types.MAP,
            types.ARRAY5_BASE | 1,
              types.STR5_BASE | 1, 'a'.charCodeAt(0),
            types.EXTENSION3_BASE, 0,
          types.MAP,
            types.ARRAY5_BASE | 1,
              types.STR5_BASE | 1, 'b'.charCodeAt(0),
            9,
          types.EXTENSION3_BASE, 1,
      ]);
      let decoded = decode(encoded, { extensions });

      expect(decoded[0]).to.be.eql(a);
      expect(decoded[1]).to.be.eql(a);
      expect(decoded[2]).to.be.eql(b);
      expect(decoded[3]).to.be.eql({ a: decoded[0] });
      expect(decoded[4]).to.be.eql(b);
      expect(decoded[5]).to.be.eql({ a: 4, b: 5, c: 6 });

      expect(decoded[0]).to.be.equal(decoded[1]);
      expect(decoded[2]).not.to.be.equal(decoded[4]);
      expect(decoded[3].a).to.be.equal(decoded[0]);
      expect(decoded[5]).to.have.keys('a', 'b', 'c');
    });

    it('can encode symbols', function () {
      if (typeof Symbol !== 'function') return;

      function getDescription(sym) {
        return String(sym).slice(7, -1);
      }

      let extensions = {
        0: class {
          constructor() {
            this.symbols = [];
          }
          isCandidate(x) { return typeof x === 'symbol' || x && x.constructor === Symbol; }
          serialise(s) {
            let i = this.symbols.indexOf(s);
            if (i >= 0) return i;
            return this.symbols.push(s) - 1;
          }
          deserialise(n, memo) {
            if (this.symbols[n] == null) {
              let s = Symbol(memo[n]);
              this.symbols[n] = s;
              return s;
            }
            return this.symbols[n];
          }
          memo() { return this.symbols.map(getDescription); }
        },
      };

      let a = Symbol('a'), b = Symbol('b');
      let data = [a, a, b];

      let encoded = encode(data, { extensions });
      expect(encoded).to.be.eql([
        types.ARRAY5_BASE | 2,
          types.STR5_BASE | 1, 'a'.charCodeAt(0),
          types.STR5_BASE | 1, 'b'.charCodeAt(0),
        types.ARRAY5_BASE | 3,
          types.EXTENSION3_BASE, 0,
          types.EXTENSION3_BASE, 0,
          types.EXTENSION3_BASE, 1,
      ]);
      let decoded = decode(encoded, { extensions });

      expect(decoded[0]).to.be.equal(decoded[1]);
      expect(decoded[0]).to.be.a('symbol');
      expect(getDescription(decoded[0])).to.be.equal('a');
      expect(getDescription(decoded[2])).to.be.equal('b');
    });

    it('can support more than one extension point that uses a memo at the same time', function () {
      let { registerIdentity, extension: identityExtension } = (() => {
        let identities = [];
        return {
          registerIdentity(x) { identities.push(x); },
          extension: class {
            isCandidate(x) { return identities.indexOf(x) >= 0; }
            serialise(o) { return identities.indexOf(o); }
            deserialise(n, memo) { return memo[n]; }
            memo() { return identities; }
          }
        };
      })();

      let numberInterningExtension = class {
        constructor() {
          this.numbers = [];
        }
        isCandidate(x) { return typeof x === 'number'; }
        serialise(n) {
          let i = this.numbers.indexOf(n);
          if (i >= 0) return i;
          return this.numbers.push(n) - 1;
        }
        deserialise(n, memo) { return memo[n]; }
        memo() { return this.numbers; }
      };

      let extensions = [
        numberInterningExtension,
        identityExtension,
      ];

      let a = { a: 999990 }, b = { b: 999990 }, c = { a: a }, d = { a: 999990, b: 999991, c: 999992, d: 999993 };
      let data = [a, a, b, c, b, d];

      registerIdentity(a);
      registerIdentity(b);

      let encoded = encode(data, { extensions });
      expect(encoded).to.be.eql([
        // memo for number interning extension
        types.ARRAY5_BASE | 6,
          types.UINT24, 15, 66, 54, // 999990
          types.UINT24, 15, 66, 55, // 999991
          types.UINT24, 15, 66, 56, // 999992
          types.UINT24, 15, 66, 57, // 999993
          0, // the index of "a" in the identities table
          1, // the index of "b" in the identities table

        // memo for object identity preservation extension
        types.ARRAY5_BASE | 2,
          types.MAP,
            types.ARRAY5_BASE | 1,
              types.STR5_BASE | 1, 'a'.charCodeAt(0),
            types.EXTENSION3_BASE, 0,
          types.MAP,
            types.ARRAY5_BASE | 1,
              types.STR5_BASE | 1, 'b'.charCodeAt(0),
            types.EXTENSION3_BASE, 0,

        types.ARRAY5_BASE | 6,
          types.EXTENSION3_BASE | 1,
            types.EXTENSION3_BASE, 4,
          types.EXTENSION3_BASE | 1,
            types.EXTENSION3_BASE, 4,
          types.EXTENSION3_BASE | 1,
            types.EXTENSION3_BASE, 5,
          types.MAP,
            types.ARRAY5_BASE | 1,
              types.STR5_BASE | 1, 'a'.charCodeAt(0),
            types.EXTENSION3_BASE | 1,
              types.EXTENSION3_BASE, 4,
          types.EXTENSION3_BASE | 1,
            types.EXTENSION3_BASE, 5,
          types.MAP,
            types.ARRAY5_BASE | 4,
              types.STR5_BASE | 1, 'a'.charCodeAt(0),
              types.STR5_BASE | 1, 'b'.charCodeAt(0),
              types.STR5_BASE | 1, 'c'.charCodeAt(0),
              types.STR5_BASE | 1, 'd'.charCodeAt(0),
            types.EXTENSION3_BASE, 0,
            types.EXTENSION3_BASE, 1,
            types.EXTENSION3_BASE, 2,
            types.EXTENSION3_BASE, 3,
      ]);
      let decoded = decode(encoded, { extensions });

      expect(decoded[0]).to.be.eql(a);
      expect(decoded[1]).to.be.eql(a);
      expect(decoded[2]).to.be.eql(b);
      expect(decoded[3]).to.be.eql({ a: decoded[0] });
      expect(decoded[4]).to.be.eql(b);
      expect(decoded[5]).to.be.eql(d);

      expect(decoded[0]).to.be.equal(decoded[1]);
      expect(decoded[2]).to.be.equal(decoded[4]);
      expect(decoded[3].a).to.be.equal(decoded[0]);

      expect(decoded[0].a).to.be.equal(a.a);
      expect(decoded[2].b).to.be.equal(b.b);
      expect(decoded[5].a).to.be.equal(d.a);
      expect(decoded[5].b).to.be.equal(d.b);
      expect(decoded[5].c).to.be.equal(d.c);
      expect(decoded[5].d).to.be.equal(d.d);
    });

  });
});
