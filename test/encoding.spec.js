'use strict';

var encode = require('../src/encoder');
var chai = require('chai');
var expect = chai.expect;

/*
todos

unicode strings
timestamp
big strings

*/

var cases = require('./cases');
describe('encoding', function () {
  var categories = Object.keys(cases);
  categories.forEach((category) => {
    describe(category, function () {
      cases[category].forEach(function (test) {
        it('should encode ' + test.desc, function () {
          expect(encode(test.value)).to.eql(test.bytes);
        });
      });
    });
  });
});
