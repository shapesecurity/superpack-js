import { expect } from 'chai';

import SuperPackTranscoder, { encode, decode } from '../..';
import types from '../../dist/cjs/type-tags';

import StringDeduplication from '../../dist/cjs/optimisations/string-deduplication.js';
import KeysetDeduplication from '../../dist/cjs/optimisations/keyset-deduplication.js';

function charCodes(string) {
  return string.split('').map(c => c.charCodeAt(0));
}

describe('built-in optimisations', function () {
  it('exports via Transcoder', function () {
    expect(SuperPackTranscoder.optimisations).to.exist;
    expect(SuperPackTranscoder.optimisations.StringDeduplication).to.be.equal(StringDeduplication);
    expect(SuperPackTranscoder.optimisations.KeysetDeduplication).to.be.equal(KeysetDeduplication);
  });

  it('exports a recommended list', function () {
    expect(SuperPackTranscoder.recommendedOptimisations).to.exist;
    expect(SuperPackTranscoder.recommendedOptimisations.length).to.equal(2);
    expect(SuperPackTranscoder.recommendedOptimisations).to.include(StringDeduplication);
    expect(SuperPackTranscoder.recommendedOptimisations).to.include(KeysetDeduplication);
  });

  describe('string deduplication', function () {
    it('stores duplicated strings only once', function () {
      let extensions = {
        0: StringDeduplication,
      };

      let data = ['abc', 'abc'];
      let encoded = encode(data, { extensions });
      expect(encoded).to.be.eql([
        types.ARRAY5_BASE | 1,
          types.STR5_BASE | 3, ...charCodes('abc'),
        types.ARRAY5_BASE | 2,
          types.EXTENSION3_BASE, 0,
          types.EXTENSION3_BASE, 0,
      ]);
      let decoded = decode(encoded, { extensions });
      expect(decoded).to.be.eql(data);
    });

    it('does not memoise strings which appear only once', function () {
      let extensions = {
        0: StringDeduplication,
      };

      let data = ['abc', 'abc', 'def'];
      let encoded = encode(data, { extensions });
      expect(encoded).to.be.eql([
        types.ARRAY5_BASE | 1,
          types.STR5_BASE | 3, ...charCodes('abc'),
        types.ARRAY5_BASE | 3,
          types.EXTENSION3_BASE, 0,
          types.EXTENSION3_BASE, 0,
          types.STR5_BASE | 3, ...charCodes('def'),
      ]);
      let decoded = decode(encoded, { extensions });
      expect(decoded).to.be.eql(data);
    });

    it('prioritises by amount saved', function () {
      let extensions = {
        0: StringDeduplication,
      };

      let s = 'short', rrls = 'really really long string', f = 'frequent';
      let data = [
        s, s, s,
        rrls, rrls,
        f, f, f, f, f, f, f,
      ];
      let encoded = encode(data, { extensions });
      expect(encoded).to.be.eql([
        types.ARRAY5_BASE | 3,
          types.STR5_BASE | f.length, ...charCodes(f),
          types.STR5_BASE | rrls.length, ...charCodes(rrls),
          types.STR5_BASE | s.length, ...charCodes(s),
        types.ARRAY5_BASE | 12,
          // short * 3
          types.EXTENSION3_BASE, 2,
          types.EXTENSION3_BASE, 2,
          types.EXTENSION3_BASE, 2,
          // really really long string * 2
          types.EXTENSION3_BASE, 1,
          types.EXTENSION3_BASE, 1,
          // frequent * 7
          types.EXTENSION3_BASE, 0,
          types.EXTENSION3_BASE, 0,
          types.EXTENSION3_BASE, 0,
          types.EXTENSION3_BASE, 0,
          types.EXTENSION3_BASE, 0,
          types.EXTENSION3_BASE, 0,
          types.EXTENSION3_BASE, 0,
      ]);
      let decoded = decode(encoded, { extensions });
      expect(decoded).to.be.eql(data);
    });
  });

  describe('keyset deduplication', function () {
    it('stores duplicated keysets only once', function () {
      let extensions = {
        0: KeysetDeduplication,
      };

      let data = [{ abc: 1, def: 2 }, { abc: 3, def: 4 }];
      let encoded = encode(data, { extensions });
      expect(encoded).to.be.eql([
        types.ARRAY5_BASE | 1,
          types.ARRAY5_BASE | 2,
            types.STR5_BASE | 3, ...charCodes('abc'),
            types.STR5_BASE | 3, ...charCodes('def'),
        types.ARRAY5_BASE | 2,
          types.EXTENSION3_BASE,
            types.ARRAY5_BASE | 3,
              0,
              1,
              2,
          types.EXTENSION3_BASE,
            types.ARRAY5_BASE | 3,
              0,
              3,
              4,
      ]);
      let decoded = decode(encoded, { extensions });
      expect(decoded).to.be.eql(data);
    });

    it('also memoises single-use keysets', function () {
      let extensions = {
        0: KeysetDeduplication,
      };

      let data = [{ abc: 1, def: 2 }, { abc: 3, def: 4 }, { abc: 5 }];
      let encoded = encode(data, { extensions });
      expect(encoded).to.be.eql([
        types.ARRAY5_BASE | 2,
          types.ARRAY5_BASE | 2,
            types.STR5_BASE | 3, ...charCodes('abc'),
            types.STR5_BASE | 3, ...charCodes('def'),
          types.ARRAY5_BASE | 1,
            types.STR5_BASE | 3, ...charCodes('abc'),
        types.ARRAY5_BASE | 3,
          types.EXTENSION3_BASE,
            types.ARRAY5_BASE | 3,
              0,
              1,
              2,
          types.EXTENSION3_BASE,
            types.ARRAY5_BASE | 3,
              0,
              3,
              4,
          types.EXTENSION3_BASE,
            types.ARRAY5_BASE | 2,
              1,
              5,
      ]);
      let decoded = decode(encoded, { extensions });
      expect(decoded).to.be.eql(data);
    });

    it('operates recursively on objects', function () {
      let extensions = {
        0: KeysetDeduplication,
      };

      let data = { abc: 1, def: { abc: 2, def: 3 } };
      let encoded = encode(data, { extensions });
      expect(encoded).to.be.eql([
        types.ARRAY5_BASE | 1,
          types.ARRAY5_BASE | 2,
            types.STR5_BASE | 3, ...charCodes('abc'),
            types.STR5_BASE | 3, ...charCodes('def'),
        types.EXTENSION3_BASE,
          types.ARRAY5_BASE | 3,
            0,
            1,
            types.EXTENSION3_BASE,
              types.ARRAY5_BASE | 3,
                0,
                2,
                3,
      ]);
      let decoded = decode(encoded, { extensions });
      expect(decoded).to.be.eql(data);
    });
  });

  describe('compatibility', function () {
    it('interacts nicely together', function () {
      let extensions = {
        0: StringDeduplication,
        1: KeysetDeduplication,
      };

      let data = [{ abc: 1, def: 2 }, { abc: 3, def: 4 }, { abc: 5 }];
      let encoded = encode(data, { extensions });
      expect(encoded).to.be.eql([
        types.ARRAY5_BASE | 1,
          types.STR5_BASE | 3, ...charCodes('abc'),
        types.ARRAY5_BASE | 2,
          types.ARRAY5_BASE | 2,
            types.EXTENSION3_BASE, 0,
            types.STR5_BASE | 3, ...charCodes('def'),
          types.ARRAY5_BASE | 1,
            types.EXTENSION3_BASE, 0,
        types.ARRAY5_BASE | 3,
          types.EXTENSION3_BASE | 1,
            types.ARRAY5_BASE | 3,
              0,
              1,
              2,
          types.EXTENSION3_BASE | 1,
            types.ARRAY5_BASE | 3,
              0,
              3,
              4,
          types.EXTENSION3_BASE | 1,
            types.ARRAY5_BASE | 2,
              1,
              5,
      ]);
      let decoded = decode(encoded, { extensions });
      expect(decoded).to.be.eql(data);
    });
  });
});
