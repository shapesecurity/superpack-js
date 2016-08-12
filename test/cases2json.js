'use strict';

var tests = require('./cases.js');
var output = [];
for (var group in tests) {
  if ({}.hasOwnProperty.call(tests, group)) {
    tests[group].forEach(function (test) {
      output.push({
        desc: group + ': ' + test.desc,
        bytes: test.bytes
      });
    });
  }
}

process.stdout.write(JSON.stringify(output) + '\n');
