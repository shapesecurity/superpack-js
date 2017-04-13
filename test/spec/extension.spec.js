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
      types.EXTENSION,
      types.UINT6_BASE | 0,
      types.ARRAY5_BASE | 2,
      types.STR5_BASE | 1, 0x61,
      types.STR5_BASE | 1, 0x69,
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
      types.EXTENSION,
      types.UINT6_BASE | 0,
      types.ARRAY5_BASE | 2,
      types.STR5_BASE | 1, 0x61,
      types.STR5_BASE | 1, 0x69,
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
        serialiser: n => "" + (n + 1),
        // deserialiser: from the intermediate value, reconstruct the original value
        deserialiser: n => parseInt(n) - 1,
      },
    };

    let encoded = encode(0, { extensions });
    expect(encoded).to.be.eql([
      types.EXTENSION,
      types.UINT6_BASE | 0,
      types.STR5_BASE | 1, 0x31,
    ]);
    let decoded = decode(encoded, { extensions });
    expect(decoded).to.be.equal(0);
  });
});
