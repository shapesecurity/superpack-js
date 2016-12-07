'use strict';

let tests = require('./cases.js');
let output = [];
for (let group in tests) {
  if ({}.hasOwnProperty.call(tests, group)) {
    tests[group].forEach(function (t) {
      output.push({
        desc: group + ': ' + t.desc,
        bytes: t.bytes
      });
    });
  }
}

process.stdout.write(JSON.stringify(output) + '\n');
