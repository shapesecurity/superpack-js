'use strict';

import { expect } from 'chai';

import gentest, { types as t } from 'gentest';

import encode from '../../src/encoder';
import decode from '../../src/decoder';


let SAMPLE_SIZE = 10;

describe('properties', function () {

  describe('integers should always encode to the same value', function () {
    let generator = t.int;
    gentest.sample(generator, SAMPLE_SIZE).forEach(function (a) {
      it('should deterministically encode ' + JSON.stringify(a), function () {
        expect(encode(a)).to.eql(encode(a));
      });
    });
  });

  describe('integers should round-trip', function () {
    let generator = t.int;
    gentest.sample(generator, SAMPLE_SIZE).forEach(function (a) {
      it('should round-trip ' + JSON.stringify(a), function () {
        expect(decode(encode(a))).to.eql(a);
      });
    });
  });

  describe('arrays should have the same length after round-tripping', function () {
    let generator = t.arrayOf(t.int);
    gentest.sample(generator, SAMPLE_SIZE).forEach(function (a) {
      it('should preserve length during round-trip of ' + JSON.stringify(a), function () {
        expect(decode(encode(a)).length).to.eql(a.length);
      });
    });
  });

  function isUint(typeTag) {
    return (0b11000000 & typeTag) < 2 || typeTag >= 0xE4 && typeTag <= 0xE7;
  }

  describe('non-negative integers should be encoded as uints', function () {
    let generator = t.fmap(Math.abs, t.int);
    gentest.sample(generator, SAMPLE_SIZE).forEach(function (a) {
      it('should encode ' + JSON.stringify(a) + ' as a uint', function () {
        expect(isUint(encode(a)[0])).to.be.true;
      });
    });
  });

  let letterGenerator = t.elements('abcdefghijklmnopqrstuvwxyz'.split(''));
  function join(charArrayGen, str) {
    if (str == null) str = '';
    return t.fmap(charArray => charArray.join(str), charArrayGen);
  }
  function capitalise(strGen) {
    return t.fmap(str => str[0].toUpperCase() + str.slice(1), strGen);
  }
  function nonEmptyArrayOf(gen) {
    return t.bind(gen, head =>
      t.fmap(
        tail => [head].concat(tail),
        t.arrayOf(gen)
      )
    );
  }


  // Note: this fails if s contains an unmatched surrogate half.
  function encodeUtf8(s) {
    let bytes = [];
    let a = unescape(encodeURIComponent(s));
    // a is an ascii representation of UTF-8 bytes
    // ref: http://monsur.hossa.in/2012/07/20/utf-8-in-javascript.html
    for (let i = 0; i < a.length; ++i) {
      bytes.push(a.charCodeAt(i));
    }
    return bytes;
  }

  function fromCodePoint(cp) {
    if (cp <= 0xFFFF) return String.fromCharCode(cp);
    let cu1 = String.fromCharCode(Math.floor((cp - 0x10000) / 0x400) + 0xD800);
    let cu2 = String.fromCharCode(((cp - 0x10000) % 0x400) + 0xDC00);
    return cu1 + cu2;
  }

  it('should encode any char as utf8', function () {
    let utf8CodePoint = t.suchThat(
      x => x < 0xD800 || x > 0xDFFF,  // surrogate pair halves break
      t.int.nonNegative);
    let generator = t.fmap(
      x => fromCodePoint(x),
      utf8CodePoint
    );
    gentest.sample(generator, SAMPLE_SIZE).forEach(c => {
      expect(encode(c).slice(1)).to.eql(encodeUtf8(c));
    });
  });

  describe('objects should round-trip', function () {
    let generator =
      t.shape({
        name: capitalise(join(nonEmptyArrayOf(letterGenerator))),
        limbs: t.fmap(x => x % 5, t.int.nonNegative),
        married: t.bool,
      });
    gentest.sample(generator, SAMPLE_SIZE).forEach(function (a) {
      it('should round-trip ' + JSON.stringify(a), function () {
        expect(decode(encode(a))).to.eql(a);
      });
    });
  });

});
