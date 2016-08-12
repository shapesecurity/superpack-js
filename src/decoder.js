'use strict';

/* eslint-disable no-unused-vars */
var UINT6_BASE = 0x00,
    UINT14_BASE = 0x40,
    NINT4_BASE = 0x80,
    BARRAY4_BASE = 0x90,
    ARRAY5_BASE = 0xA0,
    STR5_BASE = 0xC0,
    FALSE = 0xE0,
    TRUE = 0xE1,
    NULL = 0xE2,
    UNDEFINED = 0xE3,
    UINT16 = 0xE4,
    UINT24 = 0xE5,
    UINT32 = 0xE6,
    UINT64 = 0xE7,
    NINT8 = 0xE8,
    NINT16 = 0xE9,
    NINT32 = 0xEA,
    NINT64 = 0xEB,
    FLOAT32 = 0xEC,
    DOUBLE64 = 0xED,
    TIMESTAMP = 0xEE,
    BINARY_ = 0xEF,
    CSTRING = 0xF0,
    STR8 = 0xF1,
    STR_ = 0xF2,
    STRLU = 0xF3,
    ARRAY8 = 0xF4,
    ARRAY_ = 0xF5,
    BARRAY8 = 0xF6,
    BARRAY_ = 0xF7,
    MAP_ = 0xF8,
    BMAP_ = 0xF9,
    MAPL_ = 0xFA,
    BMAPL_ = 0xFB,
    STRLUT = 0xFE,
    EXTENSION = 0xFF;
/* eslint-enable no-unused-vars */

/*

Done:
uints
strings
basic values
arrays
maps
barrays, bmaps
nints
utf-8
float

todo:
mapl, bmapl
timestamp
extension
binary
factor out various common threads
*/

var stringLUT, keysetLUT, ptr;
module.exports = function decode(buf) {
  ptr = 0;
  if (buf[0] === STRLUT) {
    stringLUT = decodeValue(buf);
    keysetLUT = decodeValue(buf);
  } else {
    stringLUT = [];
    keysetLUT = [];
  }
  return decodeValue(buf);
};

function readUInt32(buf) {
  return buf[ptr++] * 0x1000000 + (buf[ptr++] << 16 | buf[ptr++] << 8 | buf[ptr++]);
}

function readFloat(buf, isDouble) {
  var mantissaLen = isDouble ? 52 : 23;
  var mixBits = isDouble ? 4 : 1;
  var expMax = (1 << (isDouble ? 11 : 8)) - 1;

  // Read sign, exponent, and beginning of mantissa from first two bytes
  var sign = buf[ptr] >> 7 ? -1 : 1;
  var exp = (buf[ptr++] & 127) << mixBits | (buf[ptr] >> (8 - mixBits));
  var mantissa = buf[ptr++] & (255 >> mixBits);

  // Read rest of mantissa, either 2 or 6 more bytes
  for (var end = ptr + 2 + 4 * isDouble; ptr < end;) {
    mantissa = mantissa * 256 + buf[ptr++];
  }

  if (exp === expMax) {
    return mantissa ? NaN : sign * Infinity;
  } else if (exp === 0) {
    // Subnormal, so don't add leading 1 to mantissa, but interpret exponent as if it were 1
    exp = 1 - (expMax >> 1);
  } else {
    // Add leading 1 to mantissa, subtract offset from exponent to get range -126 to +127
    mantissa += Math.pow(2, mantissaLen);
    exp -= expMax >> 1;
  }

  return sign * mantissa * Math.pow(2, exp - mantissaLen);
}

function readString(buf, length) {
  var str = '';
  for (var i = 0; i < length; ++i) {
    str += String.fromCharCode(buf[ptr++]);
  }
  return decodeURIComponent(escape(str));
}

function readArray(buf, length) {
  var out = [];
  for (var i = 0; i < length; ++i) {
    out.push(decodeValue(buf));
  }
  return out;
}

function readBooleanArray(buf, length) {
  var out = [];
  for (var i = 0; i < length; ++i) {
    out[i] = (buf[ptr + (i >> 3)] & (0x80 >> (i % 8))) > 0;
  }
  ptr += (length >> 3) + (length % 8 !== 0);
  return out;
}

// todo: factor out "read type_ length value"
// function readUInt(buf) {

function decodeValue(buf) {
  var type = buf[ptr++];
  if (type < UINT14_BASE) {
    return type;
  } else if (type < NINT4_BASE) {
    return (type ^ UINT14_BASE) << 8 | buf[ptr++];
  } else if (type < BARRAY4_BASE) {
    return -(type ^ NINT4_BASE);
  } else if (type < ARRAY5_BASE) {
    return readBooleanArray(buf, type ^ BARRAY4_BASE);
  } else if (type < STR5_BASE) {
    return readArray(buf, type ^ ARRAY5_BASE);
  } else if (type < FALSE) {
    return readString(buf, type ^ STR5_BASE);
  }
  switch (type) {
    case FALSE: return false;
    case TRUE: return true;
    case NULL: return null;
    case UNDEFINED: return void 0;
    case UINT16:
      return (buf[ptr++]) << 8 | buf[ptr++];
    case UINT24:
      return (buf[ptr++]) << 16 | (buf[ptr++]) << 8 | buf[ptr++];
    case UINT32:
      return readUInt32(buf);
    case UINT64:
      return readUInt32(buf) * 0x100000000 + readUInt32(buf);
    case NINT8:
      return -(buf[ptr++]);
    case NINT16:
      return -((buf[ptr++]) << 8 | buf[ptr++]);
    case NINT32:
      return -readUInt32(buf);
    case NINT64:
      return -(readUInt32(buf) * 0x100000000 + readUInt32(buf));
    case FLOAT32:
      return readFloat(buf, false);
    case DOUBLE64:
      return readFloat(buf, true);
    case TIMESTAMP:
      // todo, stubbed
      ptr += 6;
      return 0;
    case CSTRING:
      var str = '';
      while (buf[ptr] !== 0) {
        str += String.fromCharCode(buf[ptr++]);
      }
      ptr++;
      return decodeURIComponent(escape(str));
    case STR8:
      return readString(buf, buf[ptr++]);
    case STR_:
      return readString(buf, decodeValue(buf));
    case STRLU:
      return stringLUT[buf[ptr++]];

    case ARRAY8:
    case STRLUT:
      return readArray(buf, buf[ptr++]);
    case ARRAY_:
      return readArray(buf, decodeValue(buf));

    case BARRAY8:
      return readBooleanArray(buf, buf[ptr++]);
    case BARRAY_:
      return readBooleanArray(buf, decodeValue(buf));

    case MAP_:
      var out = {};
      var keysetIndex = decodeValue(buf);
      var keys = keysetLUT[keysetIndex];
      keys.forEach(function (key) {
        out[key] = decodeValue(buf);
      });
      return out;

    case BMAP_:
      var out = {};
      var keysetIndex = decodeValue(buf);
      var keys = keysetLUT[keysetIndex];
      var bools = readBooleanArray(buf, keys.length);
      for (var i = 0; i < keys.length; ++i) {
        out[keys[i]] = bools[i];
      }
      return out;

    default:
      // This should never happen.
      throw new Error('Unknown case');
  }
}
