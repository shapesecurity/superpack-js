'use strict';

import { expect } from 'chai';
import { encode } from '../../src/index';
import cases from './cases';

/*
todos

unicode strings
timestamp
big strings

*/

describe('encoding', function () {
  let categories = Object.keys(cases);
  categories.forEach((category) => {
    describe(category, function () {
      cases[category].forEach(function (t) {
        it('should encode ' + t.desc, function () {
          let opt = t.keysetsToOmit == null ? void 0 : { keysetsToOmit: t.keysetsToOmit };
          expect(encode(t.value, opt)).to.eql(t.bytes);
        });
      });
    });
  });
});
