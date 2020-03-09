'use strict';

import { expect } from 'chai';
import { encode, decode } from '../../src/index';
import cases from './cases';

let jsonStrings = [
  {
    text: '[]',
    desc: 'empty array'
  },
  {
    text: '["\\\\"]',
    desc: 'four slashes'
  },
  {
    text: '{"foo": "\\u0000"}',
    desc: 'zero byte'
  },
  {
    text: '{"foo": ""}',
    desc: 'empty value'
  },
  {
    text: '{"matzue": "松江", "asakusa": "浅草"}',
    desc: '3-byte utf-8'
  },
  {
    text: '{ "U+10ABCD": "􊯍" }',
    desc: '4-byte utf-8'
  },
  {
    text: '["Да Му Еба Майката"]',
    desc: 'bulgarian text'
  },
  {
    text: '["\\u004d\\u0430\\u4e8c\\ud800\\udf02"]',
    desc: 'codepoints from unicodes'
  },
  {
    text: '{}',
    desc: 'empty object'
  },
  {
    text: '{"foo": "bar"}',
    desc: 'foo: bar'
  },
  {
    text: '{"foo": "its \\"as is\\", \\"yeah", "bar": false}',
    desc: 'as is'
  },
  {
    text: '["one", "two"]',
    desc: 'simple array'
  },
  {
    text: '["foo", "bar", "baz",true,false,null,{"key":"value"},[null,null,null,[]]," \\\\ "]',
    desc: 'array of all types'
  },
  {
    text: '[10e-01]',
    desc: 'simple exp'
  },
  {
    text: '{"a":{"b":"c"}}',
    desc: 'nested object'
  },
  {
    text: '{"a":["b", "c"]}',
    desc: 'nested array'
  },
  {
    text: '[{"a":"b"}, {"c":"d"}]',
    desc: 'array of objects'
  },
  {
    text: '{"a": "b", "c": "d"}',
    desc: 'two-key object'
  },
  {
    text: '{"foo": true, "bar": false, "baz": null}',
    desc: 'true/false/null-valued object'
  },
  {
    text: '{"foo": "bar and all", "bar": "its \\"nice\\""}',
    desc: 'strange strings',
  },
  {
    text: '{"boolean, true": true, "boolean, false": false, "null": null }',
    desc: 'nuts and bolts',
  },
  {
    text: '["\\\\\\"\\"a\\""]',
    desc: 'excessive escape sequences',
  },
  {
    text: '["\\"and this string has an escape at the beginning", "and this string has no escapes"]',
    desc: 'escapes at beginning of of string'
  },
  {
    text: '{"CoreletAPIVersion":2,"CoreletType":"standalone",' +
          '"documentation":"A corelet that provides the capability to upload' +
          ' a folder’s contents into a user’s locker.","functions":[' +
          '{"documentation":"Displays a dialog box that allows user to ' +
          'select a folder on the local system.","name":' +
          '"ShowBrowseDialog","parameters":[{"documentation":"The ' +
          'callback function for results.","name":"callback","required":' +
          'true,"type":"callback"}]},{"documentation":"Uploads all mp3 files' +
          ' in the folder provided.","name":"UploadFolder","parameters":' +
          '[{"documentation":"The path to upload mp3 files from."' +
          ',"name":"path","required":true,"type":"string"},{"documentation":' +
          ' "The callback function for progress.","name":"callback",' +
          '"required":true,"type":"callback"}]},{"documentation":"Returns' +
          ' the server name to the current locker service.",' +
          '"name":"GetLockerService","parameters":[]},{"documentation":' +
          '"Changes the name of the locker service.","name":"SetLockerSer' +
          'vice","parameters":[{"documentation":"The value of the locker' +
          ' service to set active.","name":"LockerService","required":true' +
          ',"type":"string"}]},{"documentation":"Downloads locker files to' +
          ' the suggested folder.","name":"DownloadFile","parameters":[{"' +
          'documentation":"The origin path of the locker file.",' +
          '"name":"path","required":true,"type":"string"},{"documentation"' +
          ':"The Window destination path of the locker file.",' +
          '"name":"destination","required":true,"type":"integer"},{"docum' +
          'entation":"The callback function for progress.","name":' +
          '"callback","required":true,"type":"callback"}]}],' +
          '"name":"LockerUploader","version":{"major":0,' +
          '"micro":1,"minor":0},"versionString":"0.0.1"}',
    desc: 'long non-utf-8 object'
  },
  {
    text: '[[[["foo"]]]]',
    desc: 'deep array nesting'
  },
  {
    text: '[-9223372036854775808]',
    desc: 'underflow',
  },
  {
    text: '[9223372036854775808]',
    desc: 'overflow',
  },
  {
    text: '[0.1e2, 1e1, 3.141569, 10000000000000e-10]',
    desc: 'floats',
  },
  {
    text: '[1,0,-1,-0.3,0.3,1343.32,3345,3.1e124,' +
          ' 9223372036854775807,-9223372036854775807,0.1e2, ' +
          '1e1, 3.141569, 10000000000000e-10,' +
          '0.00011999999999999999, 6E-06, 6E-06, 1E-06, 1E-06,' +
          '"2009-10-20@20:38:21.539575", 9223372036854775808,' +
          '123456789,-123456789,' +
          '2147483647, -2147483647]',
    desc: 'various numbers'
  },
  {
    text: '{ "firstName": "John", "lastName" : "Smith", "age" : ' +
          '25, "address" : { "streetAddress": "21 2nd Street", ' +
          '"city" : "New York", "state" : "NY", "postalCode" : ' +
          ' "10021" }, "phoneNumber": [ { "type" : "home", ' +
          '"number": "212 555-1234" }, { "type" : "fax", ' +
          '"number": "646 555-4567" } ] }',
    desc: 'john smith'
  },
  {
    text: '[null,false,true]',
    desc: 'array null false true'
  },
  {
    text: '{"a":[],"c": {}, "b": true}',
    desc: 'object of [], {}, true'
  },
];

describe('json encoding cases', function () {
  jsonStrings.forEach(function (t) {
    it('should roundtrip for ' + t.desc, function () {
      let value = JSON.parse(t.text);
      let encoded = encode(value);
      let decoded = decode(encoded);
      expect(value).to.eql(decoded);
      expect(JSON.stringify(value).length).to.equal(JSON.stringify(decoded).length);
    });
  });
});

import clarinetBasicJson from './json/clarinet-basic.json';
import allTypesJson from './json/all-types.json';
import tenRecordsJson from './json/ten-records.json';

function roundTrip(value) {
  let encoded = encode(value);
  let decoded = decode(encoded);
  expect(value).to.eql(decoded);
  expect(JSON.stringify(value).length).to.equal(JSON.stringify(decoded).length);
}

describe('json files', function () {
  it('should roundtrip', function () {
    roundTrip(clarinetBasicJson);
    roundTrip(allTypesJson);
    roundTrip(tenRecordsJson);
  });
});


describe('encoding', function () {
  let categories = Object.keys(cases);
  categories.forEach((category) => {
    describe(category, function () {
      cases[category].forEach(function (t) {
        it('should encode ' + t.desc, function () {
          let encoded = encode(t.value);
          let decoded = decode(encoded);
          if (isNaN(t.value)) {
            expect(isNaN(decoded)).to.be.ok;
          } else {
            expect(t.value).to.eql(decoded);
          }
          // assert.equal(JSON.stringify(t.value).length, JSON.stringify(decoded).length);
        });
      });
    });
  });
});
