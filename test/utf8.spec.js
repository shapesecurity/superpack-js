'use strict';

var expect = require('chai').expect;

// Note: this fails if s contains an unmatched surrogate half.
function encodeUtf8(s) {
  var bytes = [];
  var a = unescape(encodeURIComponent(s));
  // a is an ascii representation of UTF-8 bytes
  // ref: http://monsur.hossa.in/2012/07/20/utf-8-in-javascript.html
  for (var i = 0; i < a.length; ++i) {
    bytes.push(a.charCodeAt(i));
  }
  return bytes;
}

function decodeUtf8(bytes) {
  return decodeURIComponent(escape(String.fromCharCode.apply(null, bytes)));
}

describe('utf8', function () {
  it('should encode any char as utf8', function () {
    this.timeout(5000);
    var i, c;
    for (i = 0; i < 0xD800; i++) {
      c = String.fromCodePoint(i);
      expect(decodeUtf8(encodeUtf8(c))).to.equal(c);
    }
    // 0xD800 to 0xDFFF are UTF-16 surrogate halves with no valid UTF-8 representation
    for (i = 0xE000; i < 0x10FFFF; i++) {
      c = String.fromCodePoint(i);
      expect(decodeUtf8(encodeUtf8(c))).to.equal(c);
    }
  });
});
