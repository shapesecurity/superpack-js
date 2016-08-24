'use strict';

var types = require('../src/type-tags.js');

var littleEndian = (function () {
  var buffer = new ArrayBuffer(2);
  new DataView(buffer).setInt16(0, 256, true);
  return new Int16Array(buffer)[0] === 256;
})();

module.exports = {
  'basic values': [
    {
      value: false,
      bytes: [types.FALSE],
      desc: 'false'
    },
    {
      value: true,
      bytes: [types.TRUE],
      desc: 'true'
    },
    {
      value: null,
      bytes: [types.NULL],
      desc: 'null'
    },
    {
      value: void 0,
      bytes: [types.UNDEFINED],
      desc: 'undefined'
    }
  ],
  'exotic numbers': [
    {
      value: 0,
      bytes: [0],
      desc: '0 as uint6'
    },
    {
      value: -0,
      bytes: [types.NINT4_BASE],
      desc: '-0 as nint4'
    },
    {
      value: -Infinity,
      bytes: [types.FLOAT32, 0xFF, 0x80, 0x00, 0x00],
      desc: '-Infinity as float'
    },
    {
      value: Infinity,
      bytes: [types.FLOAT32, 0x7F, 0x80, 0x00, 0x00],
      desc: 'Infinity as float'
    },
    {
      value: NaN,
      bytes: [types.FLOAT32, 0x7F, 0xC0, 0x00, 0x00],
      desc: 'NaN as float'
    }
  ],
  'positive integers': [
    {
      value: 1,
      bytes: [1],
      desc: '1 as uint6'
    },
    {
      value: 63,
      bytes: [63],
      desc: '63 as uint6'
    },
    {
      value: 64,
      bytes: [types.UINT14_BASE, 64],
      desc: '64 as uint14'
    },
    {
      value: 16383,
      bytes: [types.UINT14_BASE | 63, 0xFF],
      desc: '16383 as uint14'
    },
    {
      value: 65535,
      bytes: [types.UINT16, 0xFF, 0xFF],
      desc: '65535 as uint16'
    },
    {
      value: 65536,
      bytes: [types.UINT24, 0x01, 0x00, 0x00],
      desc: '65536 as uint24'
    },
    {
      value: 16777215,
      bytes: [types.UINT24, 0xFF, 0xFF, 0xFF],
      desc: '16777215 as uint24'
    },
    {
      value: 16777216,
      bytes: [types.UINT32, 0x01, 0x00, 0x00, 0x00],
      desc: '16777216 as uint32'
    },
    {
      value: 4294967295,
      bytes: [types.UINT32, 0xFF, 0xFF, 0xFF, 0xFF],
      desc: '4294967295 as uint32'
    },
    {
      value: 4294967296,
      bytes: [types.UINT64, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00],
      desc: '4294967296 as uint64'
    },
    {
      value: 0xFFFFFFFFFFFF - 0xFEDCBA,
      bytes: [types.UINT64, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0x01, 0x23, 0x45],
      desc: '2**48 - 1 - 0xFEDCBA as uint64'
    },
    {
      value: 0xFFFFFFFFFFFFF,
      bytes: [types.UINT64, 0x00, 0x0F, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF],
      desc: '2**52-1 as uint64'
    },
    {
      value: 0xFFFFFFFFFFFFFBFF,
      bytes: [types.UINT64, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xF8, 0x00],
      desc: '0xFFFFFFFFFFFFFBFF as imprecise uint64'
    }
  ],
  'negative integers': [
    {
      value: -1,
      bytes: [types.NINT4_BASE | 1],
      desc: '-1 as nint4'
    },
    {
      value: -255,
      bytes: [types.NINT8, 255],
      desc: '-255 as nint8'
    },
    {
      value: -256,
      bytes: [types.NINT16, 0x01, 0x00],
      desc: '-256 as nint16'
    },
    {
      value: -65535,
      bytes: [types.NINT16, 0xFF, 0xFF],
      desc: '-65535 as nint16'
    },
    {
      value: -65536,
      bytes: [types.NINT32, 0x00, 0x01, 0x00, 0x00],
      desc: '-65536 as nint32'
    },
    {
      value: -4294967295,
      bytes: [types.NINT32, 0xFF, 0xFF, 0xFF, 0xFF],
      desc: '-4294967295 as nint32'
    },
    {
      value: -4294967296,
      bytes: [types.NINT64, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00],
      desc: '-4294967296 as nint64'
    },
    {
      value: 0xFEDCBA - 0xFFFFFFFFFFFF,
      bytes: [types.NINT64, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0x01, 0x23, 0x45],
      desc: '-(2**48 - 1 - 0xFEDCBA) as nint64'
    },
    {
      value: -0xFFFFFFFFFFFFF,
      bytes: [types.NINT64, 0x00, 0x0F, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF],
      desc: '-(2**52-1) as nint64'
    },
    {
      value: -0xFFFFFFFFFFFFFBFF,
      bytes: [types.NINT64, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xF8, 0x00],
      desc: '-0xFFFFFFFFFFFFFBFF as imprecise nint64'
    }
  ],
  'floats and doubles': [
    {
      value: 0.5,
      bytes: [types.FLOAT32, 0x3F, 0x00, 0x00, 0x00],
      desc: '0.5 as float'
    },
    {
      value: 0.15625,
      bytes: [types.FLOAT32, 0x3E, 0x20, 0x00, 0x00],
      desc: '0.15625 as float'
    },
    {
      value: 4.125,
      bytes: [types.FLOAT32, 0x40, 0x84, 0x00, 0x00],
      desc: '4.125 as float'
    },
    {
      value: -0.15625,
      bytes: [types.FLOAT32, 0xBE, 0x20, 0x00, 0x00],
      desc: '-0.15625 as float'
    },
    {
      value: -4.125,
      bytes: [types.FLOAT32, 0xC0, 0x84, 0x00, 0x00],
      desc: '-4.125 as float'
    },
    {
      value: 0.1,
      bytes: [types.DOUBLE64, 0x3F, 0xB9, 0x99, 0x99, 0x99, 0x99, 0x99, 0x9A],
      desc: '0.1 as double'
    },
    {
      value: 1 / 3,
      bytes: [types.DOUBLE64, 0x3F, 0xD5, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55],
      desc: '1/3 as double'
    },
    {
      value: 1.0000000000000002,
      bytes: [types.DOUBLE64, 0x3F, 0xF0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01],
      desc: '1.0000000000000002 as double'
    },
    {
      value: 1.0000000000000004,
      bytes: [types.DOUBLE64, 0x3F, 0xF0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02],
      desc: '1.0000000000000004 as double'
    },
    {
      value: 123.456,
      bytes: [types.DOUBLE64, 0x40, 0x5E, 0xDD, 0x2F, 0x1A, 0x9F, 0xBE, 0x77],
      desc: '123.456 as double'
    },
    {
      value: -0.1,
      bytes: [types.DOUBLE64, 0xBF, 0xB9, 0x99, 0x99, 0x99, 0x99, 0x99, 0x9A],
      desc: '-0.1 as double'
    },
    {
      value: -1 / 3,
      bytes: [types.DOUBLE64, 0xBF, 0xD5, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55],
      desc: '-1/3 as double'
    },
    {
      value: -654.321,
      bytes: [types.DOUBLE64, 0xC0, 0x84, 0x72, 0x91, 0x68, 0x72, 0xB0, 0x21],
      desc: '-654.321 as double'
    }
  ],
  'strings': [
    {
      value: '',
      bytes: [types.STR5_BASE],
      desc: 'empty string as str5'
    },
    {
      value: 'abc',
      bytes: [types.STR5_BASE | 3, 97, 98, 99],
      desc: '"abc" as str5'
    },
    {
      value: '\u0000',
      bytes: [types.STR5_BASE | 1, 0],
      desc: 'null byte string as str5'
    },
    {
      value: 'a'.repeat(32),
      bytes: [types.CSTRING].concat(Array(32).fill(97)).concat([0]),
      desc: '32-char null-byte-free string as cstring'
    },
    {
      value: 'a'.repeat(31) + '\u0000',
      bytes: [types.STR8, 32].concat(Array(31).fill(97)).concat([0]),
      desc: '32-char null-byte-containing string as str8'
    },
    {
      value: 'a'.repeat(256),
      bytes: [types.CSTRING].concat(Array(256).fill(97)).concat([0]),
      desc: '256-char null-byte-free string as cstring'
    },
    {
      value: 'a'.repeat(255) + '\u0000',
      bytes: [types.STR_, types.UINT14_BASE | 1, 0x00].concat(Array(255).fill(97)).concat([0]),
      desc: '256-char null-byte-containing string as str_'
    },
    {
      value: 'a'.repeat(65534) + '\u0000',
      bytes: [types.STR_, 0xE4, 0xFF, 0xFF].concat(Array(65534).fill(97)).concat([0]),
      desc: '65535-char null-byte-containing string as str_'
    },
    {
      value: 'a'.repeat(65536),
      bytes: [types.CSTRING].concat(Array(65536).fill(97)).concat([0]),
      desc: '65536-char null-byte-free string as cstring'
    },
    {
      value: 'a'.repeat(65535) + '\u0000',
      bytes: [types.STR_, 0xE5, 0x01, 0x00, 0x00].concat(Array(65535).fill(97)).concat([0]),
      desc: '65536-char null-byte-containing string as str_'
    },
    // {
    //   value: 'a'.repeat(250000),
    //   bytes: [types.CSTRING].concat(Array(250000).fill(97)).concat([0]),
    //   desc: '250000-char null-byte-free string as cstring'
    // }
  ],
  'arrays': [
    {
      value: [],
      bytes: [types.ARRAY5_BASE],
      desc: 'an empty array as array4'
    },
    {
      value: [1, 2, 3],
      bytes: [types.ARRAY5_BASE | 3, 1, 2, 3],
      desc: 'a 3-element array as array4'
    },
    {
      value: [1, 2, []],
      bytes: [types.ARRAY5_BASE | 3, 1, 2, types.ARRAY5_BASE],
      desc: 'a nested empty array'
    },
    {
      value: [1, 2, [3]],
      bytes: [types.ARRAY5_BASE | 3, 1, 2, types.ARRAY5_BASE | 1, 3],
      desc: 'a nested nonempty array'
    },
    {
      value: [1, [2, [3]]],
      bytes: [types.ARRAY5_BASE | 2, 1, types.ARRAY5_BASE | 2, 2, types.ARRAY5_BASE | 1, 3],
      desc: 'doubly nested arrays'
    }
  ],
  'barrays': [
    {
      value: [true, true, false],
      bytes: [types.BARRAY4_BASE | 3, 0xC0],
      desc: 'an array of 3 booleans'
    },
    {
      value: [true, true, true, true, true, true, true, true],
      bytes: [types.BARRAY4_BASE | 8, 0xFF],
      desc: 'an array of 8 trues'
    },
    {
      value: [true, true, true, true, true, true, true, true, true],
      bytes: [types.BARRAY4_BASE | 9, 0xFF, 0x80],
      desc: 'an array of 9 trues'
    },
    {
      value: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      bytes: [types.BARRAY4_BASE | 15, 0xFF, 0xFE],
      desc: 'an array of 15 trues'
    },
    {
      value: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      bytes: [types.BARRAY8, 16, 0xFF, 0xFF],
      desc: 'an array of 16 trues'
    },
    {
      value: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      bytes: [types.BARRAY8, 17, 0xFF, 0xFF, 0x80],
      desc: 'an array of 17 trues'
    }
  ],
  'maps': [
    {
      value: { 0: 'a' },
      bytes: [
        types.STRLUT, 0,
        types.ARRAY5_BASE | 1,
        types.ARRAY5_BASE | 1,
        types.STR5_BASE | 1, 48,
        types.MAP_, 0,
        types.STR5_BASE | 1, 97,
      ],
      desc: 'a 1-element map as map_'
    },
    {
      value: { 0: 'a', 1: 'b' },
      bytes: [
        types.STRLUT, 0,
        types.ARRAY5_BASE | 1,
        types.ARRAY5_BASE | 2,
        types.STR5_BASE | 1, 48,
        types.STR5_BASE | 1, 49,
        types.MAP_, 0,
        types.STR5_BASE | 1, 97,
        types.STR5_BASE | 1, 98,
      ],
      desc: 'a 2-element map as map_'
    },
    {
      value: { a: 'b', c: { d: 'e' } },
      bytes: [
        types.STRLUT, 0,
        types.ARRAY5_BASE | 2,
        types.ARRAY5_BASE | 2,
        types.STR5_BASE | 1, 97,
        types.STR5_BASE | 1, 99,
        types.ARRAY5_BASE | 1,
        types.STR5_BASE | 1, 100,
        types.MAP_, 0,
        types.STR5_BASE | 1, 98,
        types.MAP_, 1,
        types.STR5_BASE | 1, 101,
      ],
      desc: 'a nested map'
    }
  ],
  'bmaps': [
    {
      value: { 0: false },
      bytes: [
        types.STRLUT, 0,
        types.ARRAY5_BASE | 1,
        types.ARRAY5_BASE | 1,
        types.STR5_BASE | 1, 48,
        types.BMAP_, 0,
        0,
      ],
      desc: 'a 1-element bmap with false as bmap_'
    },
    {
      value: { 0: true },
      bytes: [
        types.STRLUT, 0,
        types.ARRAY5_BASE | 1,
        types.ARRAY5_BASE | 1,
        types.STR5_BASE | 1, 48,
        types.BMAP_, 0,
        128,
      ],
      desc: 'a 1-element bmap with true as bmap_'
    },
    {
      value: { 0: false, 1: true },
      bytes: [
        types.STRLUT, 0,
        types.ARRAY5_BASE | 1,
        types.ARRAY5_BASE | 2,
        types.STR5_BASE | 1, 48,
        types.STR5_BASE | 1, 49,
        types.BMAP_, 0,
        64,
      ],
      desc: 'a 2-element bmap as bmap_'
    },
    {
      value: {
        a: true, b: true, c: false, d: false, e: false, f: false, g: true, h: true,
        i: false, j: false, k: true, l: true, m: true, n: true, o: false, p: false
      },
      bytes: [
        types.STRLUT, 0,
        types.ARRAY5_BASE | 1,
        types.ARRAY5_BASE | 16,
        types.STR5_BASE | 1, 97,
        types.STR5_BASE | 1, 98,
        types.STR5_BASE | 1, 99,
        types.STR5_BASE | 1, 100,
        types.STR5_BASE | 1, 101,
        types.STR5_BASE | 1, 102,
        types.STR5_BASE | 1, 103,
        types.STR5_BASE | 1, 104,
        types.STR5_BASE | 1, 105,
        types.STR5_BASE | 1, 106,
        types.STR5_BASE | 1, 107,
        types.STR5_BASE | 1, 108,
        types.STR5_BASE | 1, 109,
        types.STR5_BASE | 1, 110,
        types.STR5_BASE | 1, 111,
        types.STR5_BASE | 1, 112,
        types.BMAP_, 0,
        195, 60,
      ],
      desc: 'a 16-element bmap as bmap_'
    }
  ],
  'binary data and typed arrays': [
    {
      value: new ArrayBuffer,
      bytes: [types.BINARY_, types.UINT6_BASE | 0],
      desc: 'an empty ArrayBuffer',
    },
    {
      value: Uint8Array.of(0, 1, 2, 3).buffer,
      bytes: [
        types.BINARY_,
        types.UINT6_BASE | 4,
        0, 1, 2, 3,
      ],
      desc: 'a small ArrayBuffer',
    },
    {
      value: Int32Array.of(1, 2, 3).buffer,
      bytes:
        littleEndian ? [
          types.BINARY_,
          types.UINT6_BASE | 12,
          1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0,
        ] : [
          types.BINARY_,
          types.UINT6_BASE | 12,
          0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3,
        ],
      desc: 'a larger ArrayBuffer',
    },
  ],
  'dates': [
    {
      value: new Date(-1821292800000),
      bytes: [ types.TIMESTAMP, 0xFE, 0x57, 0xF2, 0x7D, 0x58, 0x00 ],
      desc: "the sinking of the RMS Titanic",
    },
    {
      value: new Date(-770172240000),
      bytes: [ types.TIMESTAMP, 0xFF, 0x4C, 0xAE, 0x28, 0x3F, 0x80 ],
      desc: "the atomic bombing of Hiroshima",
    },
    {
      value: new Date(-1000),
      bytes: [ types.TIMESTAMP, 0xFF, 0xFF, 0xFF, 0xFF, 0xFC, 0x18 ],
      desc: "one second before the epoch",
    },
    {
      value: new Date(0),
      bytes: [ types.TIMESTAMP, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ],
      desc: "the epoch",
    },
    {
      value: new Date(1000),
      bytes: [ types.TIMESTAMP, 0x00, 0x00, 0x00, 0x00, 0x03, 0xE8 ],
      desc: "one second after the epoch",
    },
    {
      value: new Date(Math.pow(2, 31) * 1000),
      bytes: [ types.TIMESTAMP, 0x01, 0xF4, 0x00, 0x00, 0x00, 0x00 ],
      desc: "the moment one-second resolution signed 32-bit integer timestamps overflow (aka the 2038 problem)",
    },
    {
      value: new Date(17077910400000),
      bytes: [ types.TIMESTAMP, 0x0F, 0x88, 0x42, 0xC8, 0x6C, 0x00 ],
      desc: "the birth of Master Chief Petty Officer John-117",
    },
  ],
};
