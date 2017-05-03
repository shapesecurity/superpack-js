import { expect } from 'chai';

import SuperPackTranscoder, { encode, decode } from '../..';
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
      // detect values which require this custom serialisation
      x => x instanceof RegExp,
      // serialiser: return an intermediate value which will be encoded instead
      r => [r.source, getFlags(r)],
      // deserialiser: from the intermediate value, reconstruct the original value
      ([source, flags]) => RegExp(source, flags),
    );

    let encoded = transcoder.encode(/a/i);
    expect(encoded).to.be.eql([
      types.EXTENSION, 0,
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
      0: {
        // detect values which require this custom serialisation
        detector: x => x instanceof RegExp,
        // serialiser: return an intermediate value which will be encoded instead
        serialiser: r => [r.source, getFlags(r)],
        // deserialiser: from the intermediate value, reconstruct the original value
        deserialiser: ([source, flags]) => RegExp(source, flags),
      },
    };

    let encoded = encode(/a/i, { extensions });
    expect(encoded).to.be.eql([
      types.EXTENSION, 0,
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
      0: {
        // detect values which require this custom serialisation
        detector: x => Math.floor(x) === x,
        // serialiser: return an intermediate value which will be encoded instead
        serialiser: n => '' + (n + 1),
        // deserialiser: from the intermediate value, reconstruct the original value
        deserialiser: n => parseInt(n) - 1,
      },
    };

    let encoded = encode(0, { extensions });
    expect(encoded).to.be.eql([
      types.EXTENSION, 0,
        types.STR5_BASE | 1, '1'.charCodeAt(0),
    ]);
    let decoded = decode(encoded, { extensions });
    expect(decoded).to.be.equal(0);
  });

  describe('stores a memo and uses it in the decoding process', function () {

    it('can reproduce the string deduplication optimisation and avoids infinite looping', function () {
      let strings = [];

      let extensions = {
        0: {
          detector: x => typeof x === 'string',
          serialiser: s => {
            let i = strings.indexOf(s);
            if (i >= 0) return i;
            return strings.push(s) - 1;
          },
          deserialiser: (n, memo) => memo[n],
          memo: () => strings,
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
          types.EXTENSION, 0, 0,
          types.EXTENSION, 0, 0,
          types.EXTENSION, 0, 1,
          types.EXTENSION, 0, 2,
          types.EXTENSION, 0, 1,
          types.EXTENSION, 0, 3,
      ]);
      let decoded = decode(encoded, { extensions });

      expect(decoded).to.be.eql(data);
    });

    it('can represent object identity and pick fields', function () {
      // parallel arrays are a poor man's Map
      let identities = [];
      let fields = [];

      function pushFieldNames(arr, fieldNames) {
        fieldNames.forEach(f => {
          if (arr.indexOf(f) < 0) arr.push(f);
        });
        arr.sort();
      }
      function registerIdentity(obj, fieldNames) {
        let idx = identities.indexOf(obj);
        if (idx >= 0) {
          pushFieldNames(fields[idx], fieldNames);
        } else {
          let idx = identities.push(obj) - 1;
          fields[idx] = [].concat(fieldNames);
        }
      }
      function pick(obj, fieldNames) {
        let out = {};
        fieldNames.forEach(f => {
          out[f] = obj[f];
        });
        return out;
      }

      let extensions = {
        0: {
          detector: x => identities.indexOf(x) >= 0,
          serialiser: o => identities.indexOf(o),
          deserialiser: (n, memo) => memo[n],
          memo: () => identities.map((o, idx) => pick(o, fields[idx])),
        },
      };

      let a = { a: 0 }, b = { b: 0 }, c = { a: a }, d = { a: 0, b: 1, c: 2, d: 3 };
      let data = [a, a, b, c, b, d];
      registerIdentity(a, []);
      registerIdentity(d, ['a', 'b']);
      registerIdentity(d, ['b', 'c']);

      let encoded = encode(data, { extensions });
      expect(encoded).to.be.eql([
        types.STRLUT, 0,
        types.ARRAY5_BASE | 4,
          types.ARRAY5_BASE | 1,
            types.STR5_BASE | 1, 'b'.charCodeAt(0),
          types.ARRAY5_BASE | 1,
            types.STR5_BASE | 1, 'a'.charCodeAt(0),
          types.ARRAY5_BASE | 0,
          types.ARRAY5_BASE | 3,
            types.STR5_BASE | 1, 'a'.charCodeAt(0),
            types.STR5_BASE | 1, 'b'.charCodeAt(0),
            types.STR5_BASE | 1, 'c'.charCodeAt(0),
        types.ARRAY5_BASE | 2,
          types.BMAP_, 2,
          types.MAP_, 3,
            0,
            1,
            2,
        types.ARRAY5_BASE | 6,
          types.EXTENSION, 0, 0,
          types.EXTENSION, 0, 0,
          types.MAP_, 0,
            0,
          types.MAP_, 1,
            types.EXTENSION, 0, 0,
          types.MAP_, 0,
            0,
          types.EXTENSION, 0, 1,
      ]);
      let decoded = decode(encoded, { extensions });

      expect(decoded[0]).to.be.eql({});
      expect(decoded[1]).to.be.eql({});
      expect(decoded[2]).to.be.eql(b);
      expect(decoded[3]).to.be.eql({ a: decoded[0] });
      expect(decoded[4]).to.be.eql(b);
      expect(decoded[5]).to.be.eql({ a: 0, b: 1, c: 2 });

      expect(decoded[0]).to.be.equal(decoded[1]);
      expect(decoded[2]).not.to.be.equal(decoded[4]);
      expect(decoded[3].a).to.be.equal(decoded[0]);
      expect(decoded[5]).to.have.keys('a', 'b', 'c');
      expect(decoded[5]).not.to.have.keys('d');
    });

    it('can encode symbols', function () {
      if (typeof Symbol !== 'function') return;

      let symbols = [];
      let decodedSymbols = [];

      function getDescription(sym) {
        return String(sym).slice(7, -1);
      }

      let extensions = {
        0: {
          detector: x => typeof x === 'symbol' || x && x.constructor === Symbol,
          serialiser: s => {
            let i = symbols.indexOf(s);
            if (i >= 0) return i;
            return symbols.push(s) - 1;
          },
          deserialiser: (n, memo) => {
            if (decodedSymbols[n] == null) {
              let s = Symbol(memo[n]);
              decodedSymbols[n] = s;
              return s;
            } else {
              return decodedSymbols[n];
            }
          },
          memo: () => symbols.map(getDescription),
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
          types.EXTENSION, 0, 0,
          types.EXTENSION, 0, 0,
          types.EXTENSION, 0, 1,
      ]);
      let decoded = decode(encoded, { extensions });

      expect(decoded[0]).to.be.equal(decoded[1]);
      expect(decoded[0]).to.be.a('symbol');
      expect(getDescription(decoded[0])).to.be.equal('a');
      expect(getDescription(decoded[2])).to.be.equal('b');
    });

    it('can support more than one extension point that uses a memo at the same time', function () {
      let identities = [];
      let numbers = [];

      let extensions = {
        // number interning
        0: {
          detector: x => typeof x === 'number',
          serialiser: n => {
            let i = numbers.indexOf(n);
            if (i >= 0) return i;
            return numbers.push(n) - 1;
          },
          deserialiser: (n, memo) => memo[n],
          memo: () => numbers,
        },
        // object identity preservation
        1: {
          detector: x => !Array.isArray(x) && typeof x === 'object' && x !== null && identities.indexOf(x) >= 0,
          serialiser: o => identities.indexOf(o),
          deserialiser: (n, memo) => memo[n],
          memo: () => identities,
        },
      };

      let a = { a: 999990 }, b = { b: 999990 }, c = { a: a }, d = { a: 999990, b: 999991, c: 999992, d: 999993 };
      let data = [a, a, b, c, b, d];
      identities.push(a, b);

      let encoded = encode(data, { extensions });
      expect(encoded).to.be.eql([
        types.STRLUT, 0,

        // keysets
        types.ARRAY5_BASE | 3,
          types.ARRAY5_BASE | 1,
            types.STR5_BASE | 1, 'a'.charCodeAt(0),
          types.ARRAY5_BASE | 4,
            types.STR5_BASE | 1, 'a'.charCodeAt(0),
            types.STR5_BASE | 1, 'b'.charCodeAt(0),
            types.STR5_BASE | 1, 'c'.charCodeAt(0),
            types.STR5_BASE | 1, 'd'.charCodeAt(0),
          types.ARRAY5_BASE | 1,
            types.STR5_BASE | 1, 'b'.charCodeAt(0),

        // memo for number interning extension
        types.ARRAY5_BASE | 6,
          0, // the index of "a" in the identities table
          1, // the index of "b" in the identities table
          types.UINT24, 15, 66, 54, // 999990
          types.UINT24, 15, 66, 55, // 999991
          types.UINT24, 15, 66, 56, // 999992
          types.UINT24, 15, 66, 57, // 999993

        // memo for object identity preservation extension
        types.ARRAY5_BASE | 2,
          types.MAP_, 0,
            types.EXTENSION, 0, 2,
          types.MAP_, 2,
            types.EXTENSION, 0, 2,

        types.ARRAY5_BASE | 6,
          types.EXTENSION, 1,
            types.EXTENSION, 0, 0,
          types.EXTENSION, 1,
            types.EXTENSION, 0, 0,
          types.EXTENSION, 1,
            types.EXTENSION, 0, 1,
          types.MAP_, 0,
            types.EXTENSION, 1,
              types.EXTENSION, 0, 0,
          types.EXTENSION, 1,
            types.EXTENSION, 0, 1,
          types.MAP_, 1,
            types.EXTENSION, 0, 2,
            types.EXTENSION, 0, 3,
            types.EXTENSION, 0, 4,
            types.EXTENSION, 0, 5,
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
