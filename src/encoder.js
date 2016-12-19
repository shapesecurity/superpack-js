import tags from './type-tags.js';

/* globals ArrayBuffer, Uint8Array */

const F8 = 0xFFFFFFFF;
const F4 = 0xFFFF;
const F2 = 0xFF;

const zeros23 = '00000000000000000000000';
let keysetLUT, keysetList: Array<Array<string>>, stringHist, stringPlaceholders;

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
  value.forEach(function (element) {
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

function encodeFloat(value, target) {
  // either float32 or double64, need to figure out which.
  let negative = value < 0;

  let exp;
  let bits = (negative ? -value : value).toString(2);
  let firstOne = bits.indexOf('1');
  let lastOne = bits.lastIndexOf('1');
  let dot = bits.indexOf('.');

  if (dot === -1) {
    exp = bits.length - 1;
  } else if (dot < firstOne) {
    exp = dot - firstOne;
  } else {
    exp = dot - 1;
  }
  let mantissa = bits.substring(firstOne + 1, lastOne + 1).replace('.', '');

  if (mantissa.length <= 23 && (exp >= -126 && exp <= 127)) {
    // yay it can fit in a float32
    exp += 127;
    if (negative) exp |= 0x100;
    mantissa = parseInt(mantissa + zeros23.slice(mantissa.length), 2);
    target.push(tags.FLOAT32);
    pushUInt32(mantissa | (exp << 23), target);
  } else {
    // need to use double64
    exp += 1023;
    if (negative) exp |= 0x800;

    mantissa = parseInt(mantissa.length > 52 ?
      mantissa.slice(0, 52) :
      mantissa + (zeros23 + zeros23 + '000000').slice(mantissa.length),
      2
    );

    target.push(tags.DOUBLE64);
    pushUInt32(((mantissa / 0x100000000) & 0xFFFFF) | (exp << 20), target);
    pushUInt32(mantissa & F8, target);
  }
}

function findIndex(keys, table, list) {
  let keyLengths = keys.map(function (key) {
    return key.length;
  }).join(',');
  let keyConcats = keys.join('');
  if (!table[keyLengths]) {
    table[keyLengths] = {};
  }
  if (typeof table[keyLengths][keyConcats] !== 'number') {
    table[keyLengths][keyConcats] = list.length;
    list.push(keys);
  }
  return table[keyLengths][keyConcats];
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
    if (!isFinite(value)) {
      if (value === Infinity) {
        target.push(tags.FLOAT32, 0x7F, 0x80, 0x00, 0x00);
      } else if (value === -Infinity) {
        target.push(tags.FLOAT32, F2, 0x80, 0x00, 0x00);
      } else if (isANaNValue(value)) {
        target.push(tags.FLOAT32, 0x7F, 0xC0, 0x00, 0x00);
      }
    } else if (Math.floor(value) === value && value < 0xFFFFFFFFFFFFFFFF) {
      encodeInteger(value, target);
    } else {
      encodeFloat(value, target);
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
    let keysetIndex = findIndex(keys, keysetLUT, keysetList);

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

export default function encode(value: any): Array<number> {
  // $FlowFixMe: output is filtered to Array<number> but hard for flow to track with our current level of annotations
  let output: Array<number | string> = [];
  keysetLUT = {};
  keysetList = [];
  stringHist = {};
  stringPlaceholders = true;

  let data = encodeValue(value, []);
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
