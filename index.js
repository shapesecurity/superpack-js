'use strict';
/* eslint-disable */

var encode = require('./dist/cjs/encoder.js').default;
var decode = require('./dist/cjs/decoder.js').default;

module.exports = {
  encode: encode,
  decode: decode,
};
