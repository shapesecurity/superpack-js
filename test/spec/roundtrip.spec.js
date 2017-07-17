import { expect } from 'chai';

import { encode, decode } from '../../src/index';
import types from '../../src/type-tags';

import floats from './floats';
import doubles from './doubles';


function showBits(n, width) {
  if (width < 0) return '';
  let bits = n.toString(2);
  width -= bits.length;
  let zeroes = '';
  while (width > 0) {
    zeroes += '0';
    --width;
  }
  return zeroes + bits;
}

function toUint32(a, b, c, d) {
  return (a * Math.pow(2, 24)) + (b << 16) + (c << 8) + d;
}


describe('floating point values', function () {
  it('can round-trip single-precision floats (binary32)', function () {
    floats.forEach(([n, i]) => {
      let actualBits = showBits(i, 32);
      let encoded = encode(n);

      expect(encoded[0]).to.be.equal(types.FLOAT32, `${n} (${actualBits}) encodes as FLOAT32`)
      expect(encoded.length).to.be.equal(5);
      let encodedBits = showBits(toUint32(encoded[1], encoded[2], encoded[3], encoded[4]), 32);
      expect(encodedBits).to.be.equal(actualBits, `${n} (${actualBits}) encodes as expected`);

      let decoded = decode(encoded);
      let doubleEncoded = encode(decoded);
      let doubleEncodedBits = showBits(toUint32(doubleEncoded[1], doubleEncoded[2], doubleEncoded[3], doubleEncoded[4]), 32);
      expect(doubleEncodedBits).to.be.equal(actualBits, `${n} (${actualBits})`);
      expect(n).to.be.equal(decoded, `${n} (${actualBits}) successfully round-trips`);
    });
  });

  it('can round-trip double-precision floats (binary64)', function () {
    doubles.forEach(([n, high, low]) => {
      let actualBits = showBits(high, 32) + showBits(low, 32);
      let encoded = encode(n);
      if (encoded[0] === types.FLOAT32) return;

      expect(encoded[0]).to.be.equal(types.DOUBLE64, `${n} (${actualBits}) encodes as DOUBLE64`);
      expect(encoded.length).to.be.equal(9);
      let h0 = toUint32(encoded[1], encoded[2], encoded[3], encoded[4]);
      let l0 = toUint32(encoded[5], encoded[6], encoded[7], encoded[8]);
      let encodedBits = `${showBits(h0, 32)}${showBits(l0, 32)}`;
      expect(encodedBits).to.be.equal(actualBits, `${n} (${actualBits}) encodes as expected`);

      let decoded = decode(encoded);
      let doubleEncoded = encode(decoded);
      let h1 = toUint32(doubleEncoded[1], doubleEncoded[2], doubleEncoded[3], doubleEncoded[4]);
      let l1 = toUint32(doubleEncoded[5], doubleEncoded[6], doubleEncoded[7], doubleEncoded[8]);
      let doubleEncodedBits = `${showBits(h1, 32)}${showBits(l1, 32)}`;
      expect(doubleEncodedBits).to.be.equal(actualBits);
      expect(n).to.be.equal(decoded, `${n} (${actualBits}) successfully round-trips`);
    });
  });
});
