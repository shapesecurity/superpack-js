'use strict';

var gentest = require('gentest');
var t = gentest.types;
var chai = require('chai');
var expect = chai.expect;

var encode = require('../src/encoder');
var decode = require('../src/decoder');
var tt = require('../src/type-tags');


var SAMPLE_SIZE = 10;

describe('properties', function () {

  describe('integers should always encode to the same value', function () {
    var generator = t.int;
    gentest.sample(generator, SAMPLE_SIZE).forEach(function (a) {
      it('should deterministically encode ' + JSON.stringify(a), function () {
        expect(encode(a)).to.eql(encode(a));
      });
    });
  });

  describe('integers should round-trip', function () {
    var generator = t.int;
    gentest.sample(generator, SAMPLE_SIZE).forEach(function (a) {
      it('should round-trip ' + JSON.stringify(a), function () {
        expect(decode(encode(a))).to.eql(a);
      });
    });
  });

  describe('arrays should have the same length after round-tripping', function () {
    var generator = t.arrayOf(t.int);
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
    var generator = t.fmap(Math.abs, t.int);
    gentest.sample(generator, SAMPLE_SIZE).forEach(function (a) {
      it('should encode ' + JSON.stringify(a) + ' as a uint', function () {
        expect(isUint(encode(a)[0])).to.be.true;
      });
    });
  });

  var letterGenerator = t.elements('abcdefghijklmnopqrstuvwxyz'.split(''));
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

  describe('objects should round-trip', function () {
    var generator =
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
