import { expect } from 'chai';

import SuperPackTranscoder, { encode, decode } from '../..';
import types from '../../src/type-tags';

import StringDeduplicationOptimisation from '../../src/optimisations/string-deduplication.js';

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
          types.STR5_BASE | 1, 'a'.charCodeAt(0), 'b'.charCodeAt(0), 'c'.charCodeAt(0),
        types.EXTENSION3_BASE,
      ]);
      let decoded = decode(encoded, { extensions });
      expect(decoded).to.be.eql(data);
    });

    it('prioritises by amount saved', function () {

    });
  });
});
