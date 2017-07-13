'use strict';

import { expect } from 'chai';
import { encode } from '../../src/index';
import cases from './cases';

describe('encoding', function () {
  let categories = Object.keys(cases);
  categories.forEach((category) => {
    describe(category, function () {
      cases[category].forEach(function (t) {
        it('should encode ' + t.desc, function () {
          expect(encode(t.value)).to.eql(t.bytes);
        });
      });
    });
  });
});
