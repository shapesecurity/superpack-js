import { expect } from 'chai';

import SuperPackTranscoder, { encode, decode } from '../..';
import types from '../../dist/cjs/type-tags';

import StringDeduplicationOptimisation from '../../dist/cjs/optimisations/string-deduplication.js';

function charCodes(string) {
  return string.split('').map(c => c.charCodeAt(0));
}

describe('built-in optimisations', function () {
  it('exports via Transcoder', function () {
    expect(SuperPackTranscoder.optimisations).to.exist;
    expect(SuperPackTranscoder.optimisations.StringDeduplicationOptimisation).to.be.equal(StringDeduplicationOptimisation);
  });

  it('exports a recommended list', function () {
    expect(SuperPackTranscoder.recommendedOptimisations).to.exist;
    expect(SuperPackTranscoder.recommendedOptimisations).to.include(StringDeduplicationOptimisation);
  });

  describe('string deduplication', function () {
    it('stores duplicated strings only once', function () {
      let extensions = {
        0: StringDeduplicationOptimisation,
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
        0: StringDeduplicationOptimisation,
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
        0: StringDeduplicationOptimisation,
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
});
