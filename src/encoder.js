/* global ArrayBuffer Uint8Array Float32Array Float64Array */

import tags from './type-tags.js';
import Extendable from './extendable.js';
import type { ExtensionMap, ExtensionPoint } from './extendable.js';

type ExtensionPlaceholder = { value: any, extensionPoint: ExtensionPoint };

type Byte = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59 | 60 | 61 | 62 | 63 | 64 | 65 | 66 | 67 | 68 | 69 | 70 | 71 | 72 | 73 | 74 | 75 | 76 | 77 | 78 | 79 | 80 | 81 | 82 | 83 | 84 | 85 | 86 | 87 | 88 | 89 | 90 | 91 | 92 | 93 | 94 | 95 | 96 | 97 | 98 | 99 | 100 | 101 | 102 | 103 | 104 | 105 | 106 | 107 | 108 | 109 | 110 | 111 | 112 | 113 | 114 | 115 | 116 | 117 | 118 | 119 | 120 | 121 | 122 | 123 | 124 | 125 | 126 | 127 | 128 | 129 | 130 | 131 | 132 | 133 | 134 | 135 | 136 | 137 | 138 | 139 | 140 | 141 | 142 | 143 | 144 | 145 | 146 | 147 | 148 | 149 | 150 | 151 | 152 | 153 | 154 | 155 | 156 | 157 | 158 | 159 | 160 | 161 | 162 | 163 | 164 | 165 | 166 | 167 | 168 | 169 | 170 | 171 | 172 | 173 | 174 | 175 | 176 | 177 | 178 | 179 | 180 | 181 | 182 | 183 | 184 | 185 | 186 | 187 | 188 | 189 | 190 | 191 | 192 | 193 | 194 | 195 | 196 | 197 | 198 | 199 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 209 | 210 | 211 | 212 | 213 | 214 | 215 | 216 | 217 | 218 | 219 | 220 | 221 | 222 | 223 | 224 | 225 | 226 | 227 | 228 | 229 | 230 | 231 | 232 | 233 | 234 | 235 | 236 | 237 | 238 | 239 | 240 | 241 | 242 | 243 | 244 | 245 | 246 | 247 | 248 | 249 | 250 | 251 | 252 | 253 | 254 | 255;
type SuperPackedValue = Array<Byte>;
type SuperPackedValueWithPlaceholders = Array<number | ExtensionPlaceholder>;

const F16 = 0xFFFFFFFFFFFFFFFF;
const F8 = 0xFFFFFFFF;
const F4 = 0xFFFF;
const F2 = 0xFF;

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
  if (value >= 0) {
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

function encodeString(str : string, target : SuperPackedValueWithPlaceholders) {
  // Note: this encoding fails if value contains an unmatched surrogate half.
  // utf8Ascii will be an ascii representation of UTF-8 bytes
  // ref: http://monsur.hossa.in/2012/07/20/utf-8-in-javascript.html
  let utf8Bytes = [];
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

/* istanbul ignore next */
let encodeFloatFallback = (value: number, target : SuperPackedValueWithPlaceholders) : void => {
  // eBits + mBits + 1 is a multiple of 8
  let eBits = 11;
  let mBits = 52;
  let bias = (1 << (eBits - 1)) - 1;

  let isNegative = value < 0 || value === 0 && 1 / value < 0;
  let v = Math.abs(value);

  let exp, mantissa;
  if (v === 0) {
    exp = bias;
    mantissa = 0;
  } else if (v >= Math.pow(2, 1 - bias)) {
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
    bits.unshift(!!(mantissa & 1));
    mantissa = Math.floor(mantissa / 2);
  }
  for (let i = eBits; i > 0; i -= 1) {
    bits.unshift(!!(exp & 1));
    exp = Math.floor(exp / 2);
  }
  bits.unshift(isNegative);

  target.push(tag);
  // pack into bytes
  for (let i = 0; i < bits.length; i += 8) {
    target.push(byteFromBools(bits, i));
  }
};

let encodeFloat =
  (typeof Float32Array === 'function' && typeof Float64Array === 'function' && typeof Uint8Array === 'function')
    ? ((value: number, target : SuperPackedValueWithPlaceholders) : void => {
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
    })
    : /* istanbul ignore next */ encodeFloatFallback;


function isANaNValue(value) { // eslint-disable-line no-shadow
  return value !== value; // eslint-disable-line no-self-compare
}

function byteFromBools(bools: Array<boolean>, offset: number): number {
  return +bools[offset] << 7 |
    +bools[offset + 1] << 6 |
    +bools[offset + 2] << 5 |
    +bools[offset + 3] << 4 |
    +bools[offset + 4] << 3 |
    +bools[offset + 5] << 2 |
    +bools[offset + 6] << 1 |
    +bools[offset + 7];
}

function pushUInt32(n, target) {
  target.push(n >>> 24, (n >> 16) & F2, (n >> 8) & F2, n & F2);
}

/* istanbul ignore next */
function roundToEven(n) {
  let w = Math.floor(n), f = n - w;
  if (f < 0.5) return w;
  if (f > 0.5) return w + 1;
  return w % 2 ? w + 1 : w;
}

function find(arrayLike, predicate) {
  for (let i = 0; i < arrayLike.length; ++i) {
    let el = arrayLike[i];
    if (predicate(el)) return el;
  }
  return null;
}


export default class Encoder extends Extendable {
  placeholderMap : { [extensionPoint : ExtensionPoint] : Array<ExtensionPlaceholder> }

  constructor() {
    super();
    this.placeholderMap = Object.create(null);
  }

  static encode(value : any, options? : { extensions? : ExtensionMap } = {}) : SuperPackedValue {
    let e = new Encoder;
    const extensions = options.extensions;
    if (extensions != null) {
      // $FlowFixMe: flow doesn't understand that ext is an ExtensionPoint
      Object.keys(extensions).forEach((ext : ExtensionPoint) => {
        e.extend(ext, extensions[ext]);
      });
    }
    return e.encode(value);
  }

  encode(value : any) : SuperPackedValue {
    this.initialiseExtensions();

    let bytesWithPlaceholders = this.encodeValue(value, []);
    return this.replaceExtensionPlaceholders(bytesWithPlaceholders);
  }

  /* begin private use area */

  pushArrayElements(value : any, target : SuperPackedValueWithPlaceholders, enabledExtensions?: Array<ExtensionPoint>) {
    [].forEach.call(value, element => {
      this.encodeValue(element, target, enabledExtensions);
    });
  }

  replaceExtensionPlaceholders(target: SuperPackedValueWithPlaceholders) : SuperPackedValue {
    let enabledExtensions = Object.keys(this.extensions).map(e => +e).sort();
    while (enabledExtensions.length > 0) {
      let extensionPoint = enabledExtensions.pop();
      let extension = this.extensions[extensionPoint];

      if ({}.hasOwnProperty.call(this.placeholderMap, extensionPoint)) {
        this.placeholderMap[extensionPoint].forEach(placeholder => {
          let extTarget = [];
          if (extension.shouldSerialise == null || extension.shouldSerialise(placeholder.value)) {
            if (extensionPoint < 8) {
              extTarget.push(tags.EXTENSION3_BASE | extensionPoint);
            } else {
              extTarget.push(tags.EXTENSION_);
              encodeUInt(extensionPoint, extTarget);
            }
            this.encodeValue(extension.serialise(placeholder.value), extTarget, enabledExtensions);
          } else {
            this.encodeValue(placeholder.value, extTarget, enabledExtensions);
          }
          target.splice(target.indexOf(placeholder), 1, ...extTarget);
        });
      }

      if (typeof extension.memo === 'function') {
        target.unshift(...this.encodeValue(extension.memo(), [], enabledExtensions));
      }
    }

    return ((target : any) : SuperPackedValue);
  }

  addToPlaceholderMap(placeholder : ExtensionPlaceholder) : void {
    let ext = placeholder.extensionPoint;
    if ({}.hasOwnProperty.call(this.placeholderMap, ext)) {
      this.placeholderMap[ext].push(placeholder);
    } else {
      this.placeholderMap[ext] = [placeholder];
    }
  }

  encodeValue(value: any, target: SuperPackedValueWithPlaceholders, enabledExtensions?: Array<ExtensionPoint>) {
    let ext = find(
      enabledExtensions || Object.keys(this.extensions),
      // $FlowFixMe: flow doesn't understand that e is an ExtensionPoint
      (e : ExtensionPoint) => this.extensions[e].isCandidate(value)
    );
    if (ext != null) {
      let placeholder = ({
        value,
        extensionPoint: +ext,
      } : ExtensionPlaceholder);
      this.addToPlaceholderMap(placeholder);
      target.push(placeholder);
    } else if (value === false) {
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
        if (Math.floor(v) === v && v <= F16 && (v !== 0 || 1 / value > 0)) {
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
      encodeString(value, target);
    } else if ({}.toString.call(value) === '[object Date]') {
      encodeDate(value, target);
    } else if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
      target.push(tags.BINARY_);
      this.encodeValue(value.byteLength, target, enabledExtensions);
      this.pushArrayElements(new Uint8Array(value), target, enabledExtensions);
    } else if (Array.isArray(value)) {
      let numElements = value.length;

      let containsOnlyBooleans = true;

      containsOnlyBooleans = value.every(element => typeof element === 'boolean');

      if (containsOnlyBooleans && numElements > 0) {
        if (numElements <= 15) {
          target.push(tags.BARRAY4_BASE | numElements);
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
        } else {
          target.push(tags.ARRAY_);
          encodeUInt(numElements, target);
        }
        this.pushArrayElements(value, target, enabledExtensions);
      }
    } else {
      // assumption: anything not in an earlier case can be treated as an object
      let keys: string[] = Object.keys(value).sort();
      let numKeys = keys.length;

      let containsOnlyBooleans = keys.every(key => typeof value[key] === 'boolean');

      if (containsOnlyBooleans) {
        target.push(tags.BMAP);
        this.encodeValue(keys, target, enabledExtensions);

        let b = [false, false, false, false, false, false, false, false];
        for (let i = 0; i < numKeys; i += 8) {
          for (let j = 0; j < 8; ++j) {
            b[j] = i + j < numKeys && value[keys[i + j]];
          }
          target.push(byteFromBools(b, 0));
        }
      } else {
        target.push(tags.MAP);
        this.encodeValue(keys, target, enabledExtensions);

        keys.forEach(key => this.encodeValue(value[key], target, enabledExtensions));
      }
    }
    return target;
  }
}

export const encode = Encoder.encode;
