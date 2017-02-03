import tags from './type-tags.js';

/* globals ArrayBuffer, Uint8Array */

const F16 = 0xFFFFFFFFFFFFFFFF;
const F8 = 0xFFFFFFFF;
const F4 = 0xFFFF;
const F2 = 0xFF;

let keysetList: Array<Array<string>>, stringHist, stringPlaceholders;

function isANaNValue(value) { // eslint-disable-line no-shadow
  return value !== value; // eslint-disable-line no-self-compare
}

function byteFromBools(bools, offset) {
  return bools[offset] << 7 |
    bools[offset + 1] << 6 |
    bools[offset + 2] << 5 |
    bools[offset + 3] << 4 |
    bools[offset + 4] << 3 |
    bools[offset + 5] << 2 |
    bools[offset + 6] << 1 |
    bools[offset + 7];
}

function pushUInt32(n, target) {
  target.push(n >>> 24, (n >> 16) & F2, (n >> 8) & F2, n & F2);
}

function pushArrayElements(value, target) {
  [].forEach.call(value, function (element) {
    encodeValue(element, target);
  });
}

function encodeString(str, target, lut) {
  let index = lut ? lut.indexOf(str) : -1;
  if (index !== -1) {
    // Using indexOf knowing lut.length <= 255 so it's O(1)
    // todo: consider better ways to do this
    target.push(tags.STRREF, index);
  } else {
    // Note: this encoding fails if value contains an unmatched surrogate half.
    // utf8Ascii will be an ascii representation of UTF-8 bytes
    // ref: http://monsur.hossa.in/2012/07/20/utf-8-in-javascript.html
    let utf8Bytes = [];
    // $FlowFixMe: flow doesn't know about unescape yet
    let utf8Ascii = unescape(encodeURIComponent(str));
    let containsNull = false;
    for (let i = 0; i < utf8Ascii.length; ++i) {
      utf8Bytes.push(utf8Ascii.charCodeAt(i));
      if (utf8Bytes[i] === 0) containsNull = true;
    }

    let numBytes = utf8Bytes.length;
    if (numBytes < 32) {
      target.push(tags.STR5_BASE | numBytes);
    } else if (!containsNull) {
      target.push(tags.CSTRING);
      utf8Bytes.push(0);
    } else if (numBytes <= F2) {
      target.push(tags.STR8, numBytes);
    } else {
      target.push(tags.STR_);
      encodeUInt(numBytes, target);
    }
    const APPLY_CHUNK_SIZE = 0xFFFF;
    if (utf8Bytes.length > APPLY_CHUNK_SIZE) {
      for (let i = 0; i < utf8Bytes.length; i += APPLY_CHUNK_SIZE) {
        [].push.apply(target, utf8Bytes.slice(i, i + APPLY_CHUNK_SIZE));
      }
    } else {
      [].push.apply(target, utf8Bytes);
    }
  }
}

function encodeUInt(value, target) {
  if (value <= 63) {
    target.push(value);
  } else if (value <= 0x3FFF) {
    target.push(tags.UINT14_BASE | (value >> 8), value & F2);
  } else if (value <= F4) {
    target.push(tags.UINT16, value >> 8, value & F2);
  } else if (value <= 0xFFFFFF) {
    target.push(tags.UINT24, value >> 16, (value >> 8) & F2, value & F2);
  } else if (value <= F8) {
    target.push(tags.UINT32);
    pushUInt32(value, target);
  } else {
    target.push(tags.UINT64);
    pushUInt32((value / 0x100000000) & F8, target);
    pushUInt32(value & F8, target);
  }
}

function encodeInteger(value, target) {
  if (value === 0 && 1 / value === -Infinity) {
    target.push(tags.NINT4_BASE);
  } else if (value >= 0) {
    encodeUInt(value, target);
  } else {
    let magnitude = -value;
    if (magnitude <= 15) {
      target.push(tags.NINT4_BASE | magnitude);
    } else if (magnitude <= F2) {
      target.push(tags.NINT8, magnitude);
    } else if (magnitude <= F4) {
      target.push(tags.NINT16, magnitude >> 8, magnitude & F2);
    } else if (magnitude <= F8) {
      target.push(tags.NINT32);
      pushUInt32(magnitude, target);
    } else {
      target.push(tags.NINT64);
      pushUInt32((magnitude / 0x100000000) & F8, target);
      pushUInt32(magnitude & F8, target);
    }
  }
}

function encodeDate(value, target) {
  // timestamp: same as int48, with unix timestamp in ms
  let timestamp = Date.prototype.getTime.call(value);
  let high = timestamp / 0x100000000;
  if (timestamp < 0) --high;
  target.push(tags.TIMESTAMP, (high >>> 8) & F2, high & F2);
  pushUInt32(timestamp >>> 0, target);
}

function roundToEven(n) {
  let w = Math.floor(n), f = n - w;
  if (f < 0.5) return w;
  if (f > 0.5) return w + 1;
  return w % 2 ? w + 1 : w;
}

let encodeFloat;
/* global Float32Array Float64Array */
if (typeof Float32Array === 'function' && typeof Float64Array === 'function' && typeof Uint8Array === 'function') {
  encodeFloat = function (value: number, target) {
    let tag = tags.FLOAT32;
    let f = new Float32Array(1);
    f[0] = value;
    if (f[0] !== value) {
      tag = tags.DOUBLE64;
      f = new Float64Array(1);
      f[0] = value;
    }
    let u = new Uint8Array(f.buffer);
    target.push(tag);
    for (let i = u.length - 1; i >= 0; --i) {
      target.push(u[i]);
    }
  };
} else {
  encodeFloat = function (value: number, target) {
    // eBits + mBits + 1 is a multiple of 8
    let eBits = 11;
    let mBits = 52;
    let bias = (1 << (eBits - 1)) - 1;

    let isNegative = value < 0;
    let v = Math.abs(value);

    let exp, mantissa;
    if (v >= Math.pow(2, 1 - bias)) {
      // normal
      exp = Math.min(Math.floor(Math.log(v) / Math.LN2), 1023);
      let significand = v / Math.pow(2, exp);
      if (significand < 1) {
        exp -= 1;
        significand *= 2;
      }
      if (significand >= 2) {
        exp += 1;
        significand /= 2;
      }
      let mMax = Math.pow(2, mBits);
      mantissa = roundToEven(significand * mMax) - mMax;
      exp += bias;
      if (mantissa / mMax >= 1) {
        exp += 1;
        mantissa = 0;
      }
      if (exp > 2 * bias) {
        // overflow
        exp = (1 << eBits) - 1;
        mantissa = 0;
      }
    } else {
      // subnormal
      exp = 0;
      mantissa = roundToEven(v / Math.pow(2, (1 - bias) - mBits));
    }

    let tag = tags.DOUBLE64;

    // see if this can be represented using a FLOAT32 without dropping any significant bits
    if ((mantissa & 0x1FFFFFFF) === 0 && Math.abs(exp - bias) < 256) {
      tag = tags.FLOAT32;
      eBits = 8;
      mBits = 23;
      mantissa /= 0x1FFFFFFF;
      exp += bias;
      bias = (1 << (eBits - 1)) - 1;
      exp -= bias;
      if (v < Math.pow(2, 1 - bias)) {
        // subnormal
        exp = 0;
        mantissa = roundToEven(v / Math.pow(2, (1 - bias) - mBits));
      }
    }

    // align sign, exponent, mantissa
    let bits = [];
    for (let i = mBits - 1; i >= 0; --i) {
      bits.unshift(mantissa & 1);
      mantissa = Math.floor(mantissa / 2);
    }
    for (let i = eBits; i > 0; i -= 1) {
      bits.unshift(exp & 1);
      exp = Math.floor(exp / 2);
    }
    bits.unshift(isNegative ? 1 : 0);

    target.push(tag);
    // pack into bytes
    for (let i = 0; i < bits.length; i += 8) {
      target.push(byteFromBools(bits, i));
    }
  };
}

// WARN: keys are sorted
function findKeysetIndex(keys, list) {
  let index = findIndex(list, a => isSortedArrayOfThingsSameAsSortedArrayOfThings(a, keys));
  if (index < 0) {
    return list.push(keys) - 1;
  }
  return index;
}

function buildLUT(hist) {
  // Keep the up-to-255 keys that will save the most space, sorted by savings
  return Object.keys(hist).filter(function (key) {
    return hist[key] >= 2 && key.length * hist[key] >= 8;
  }).map(function (key) {
    // [key, expected savings]
    return [key, ((key.length + 1) * hist[key]) - (key.length + 1 + 2 * hist[key])];
  }).sort(function (e1, e2) {
    return e2[1] - e1[1];
  }).slice(0, 255).map(function (elt) {
    return elt[0];
  });
}

function encodeValue(value: any, target: Array<number | string>) {
  let containsOnlyBooleans;
  if (value === false) {
    target.push(tags.FALSE);
  } else if (value === true) {
    target.push(tags.TRUE);
  } else if (value === null) {
    target.push(tags.NULL);
  } else if (typeof value === 'undefined') {
    target.push(tags.UNDEFINED);
  } else if (typeof value === 'number') {
    if (isFinite(value)) {
      let v = Math.abs(value);
      if (Math.floor(v) === v && v < F16 && (v !== 0 || 1 / value > 0)) {
        encodeInteger(value, target);
      } else {
        encodeFloat(value, target);
      }
    } else if (value === 1 / 0) {
      target.push(tags.FLOAT32, 0x7F, 0x80, 0x00, 0x00);
    } else if (value === -1 / 0) {
      target.push(tags.FLOAT32, 0xFF, 0x80, 0x00, 0x00);
    } else if (isANaNValue(value)) {
      target.push(tags.FLOAT32, 0x7F, 0xC0, 0x00, 0x00);
    }
  } else if (typeof value === 'string') {
    // Push the string itself for handling later
    if (stringPlaceholders) {
      stringHist[value] = (stringHist[value] || 0) + 1;
      target.push(value);
    } else {
      encodeString(value, target);
    }
  } else if ({}.toString.call(value) === '[object Date]') {
    encodeDate(value, target);
  } else if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    target.push(tags.BINARY_);
    encodeValue(value.byteLength, target);
    pushArrayElements(new Uint8Array(value), target);
  } else if (Array.isArray(value)) {
    let numElements = value.length;
    containsOnlyBooleans = true;

    containsOnlyBooleans = value.every(function (element) {
      return typeof element === 'boolean';
    });

    if (containsOnlyBooleans && numElements > 0) {
      if (numElements <= 15) {
        target.push(tags.BARRAY4_BASE | numElements);
      } else if (numElements <= 255) {
        target.push(tags.BARRAY8, numElements);
      } else {
        target.push(tags.BARRAY_);
        encodeUInt(numElements, target);
      }
      for (let i = 0; i < numElements; i += 8) {
        // note: there's some out of bounds going on here, but it works out like we want
        target.push(byteFromBools(value, i));
      }
    } else {
      if (numElements <= 31) {
        target.push(tags.ARRAY5_BASE | numElements);
      } else if (numElements <= 255) {
        target.push(tags.ARRAY8, numElements);
      } else {
        target.push(tags.ARRAY_);
        encodeUInt(numElements, target);
      }
      pushArrayElements(value, target);
    }
  } else {
    // assumption: anything not in an earlier case can be treated as an object
    let keys: string[] = Object.keys(value).sort();
    let numKeys = keys.length;
    let keysetIndex = findKeysetIndex(keys, keysetList);

    containsOnlyBooleans = keys.every(function (key) {
      return typeof value[key] === 'boolean';
    });

    if (containsOnlyBooleans) {
      target.push(tags.BMAP_);
      encodeUInt(keysetIndex, target);

      let b = [0, 0, 0, 0, 0, 0, 0, 0];
      for (let i = 0; i < numKeys; i += 8) {
        for (let j = 0; j < 8; ++j) {
          // $FlowFixMe: flow doesn't like our fancy hacks
          b[j] = i + j < numKeys && value[keys[i + j]];
        }
        target.push(byteFromBools(b, 0));
      }
    } else {
      target.push(tags.MAP_);
      encodeUInt(keysetIndex, target);

      keys.forEach(function (key) {
        encodeValue(value[key], target);
      });
    }
  }
  return target;
}

function findIndex(a, predicate) {
  for (let i = 0; i < a.length; ++i) {
    if (predicate(a[i])) return i;
  }
  return -1;
}

function isSortedArrayOfThingsSameAsSortedArrayOfThings(a, b) {
  return a.length === b.length && a.every((c, i) => b[i] === c);
}

export default function encode(value: any, options?: { keysetsToOmit?: Array<Array<string>> } = {}): Array<number> {
  // $FlowFixMe: output is filtered to Array<number> but hard for flow to track with our current level of annotations
  let output: Array<number | string> = [];
  keysetList = [];
  stringHist = {};
  stringPlaceholders = true;

  if (options.keysetsToOmit != null) {
    [].push.apply(keysetList, options.keysetsToOmit);
  }

  let data = encodeValue(value, []);

  if (options.keysetsToOmit != null) {
    keysetList = keysetList.slice(options.keysetsToOmit.length);
  }

  let keysetData = encodeValue(keysetList, []);
  let stringLUT = buildLUT(stringHist);

  stringPlaceholders = false;

  if (stringLUT.length > 0 || keysetList.length > 0) {
    output.push(tags.STRLUT);
    output.push(stringLUT.length);
    pushArrayElements(stringLUT, output);
    data = keysetData.concat(data);
  }

  data.forEach(function (piece) {
    if (typeof piece === 'string') {
      encodeString(piece, output, stringLUT);
    } else {
      output.push(piece);
    }
  });

  return output;
}
