/* global Uint8Array ArrayBuffer */

import tags from './type-tags.js';
import Extendable from './extendable.js';
import type { ExtensionMap, ExtensionPoint } from './extendable.js';

type Byte = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59 | 60 | 61 | 62 | 63 | 64 | 65 | 66 | 67 | 68 | 69 | 70 | 71 | 72 | 73 | 74 | 75 | 76 | 77 | 78 | 79 | 80 | 81 | 82 | 83 | 84 | 85 | 86 | 87 | 88 | 89 | 90 | 91 | 92 | 93 | 94 | 95 | 96 | 97 | 98 | 99 | 100 | 101 | 102 | 103 | 104 | 105 | 106 | 107 | 108 | 109 | 110 | 111 | 112 | 113 | 114 | 115 | 116 | 117 | 118 | 119 | 120 | 121 | 122 | 123 | 124 | 125 | 126 | 127 | 128 | 129 | 130 | 131 | 132 | 133 | 134 | 135 | 136 | 137 | 138 | 139 | 140 | 141 | 142 | 143 | 144 | 145 | 146 | 147 | 148 | 149 | 150 | 151 | 152 | 153 | 154 | 155 | 156 | 157 | 158 | 159 | 160 | 161 | 162 | 163 | 164 | 165 | 166 | 167 | 168 | 169 | 170 | 171 | 172 | 173 | 174 | 175 | 176 | 177 | 178 | 179 | 180 | 181 | 182 | 183 | 184 | 185 | 186 | 187 | 188 | 189 | 190 | 191 | 192 | 193 | 194 | 195 | 196 | 197 | 198 | 199 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 209 | 210 | 211 | 212 | 213 | 214 | 215 | 216 | 217 | 218 | 219 | 220 | 221 | 222 | 223 | 224 | 225 | 226 | 227 | 228 | 229 | 230 | 231 | 232 | 233 | 234 | 235 | 236 | 237 | 238 | 239 | 240 | 241 | 242 | 243 | 244 | 245 | 246 | 247 | 248 | 249 | 250 | 251 | 252 | 253 | 254 | 255;
type SuperPackedValue = Array<Byte>;

function within(t, base, nBits) {
  return (t >>> nBits) == (base >>> nBits);
}

export default class Decoder extends Extendable {
  buffer : SuperPackedValue
  ptr : number
  memos : { [e : ExtensionPoint] : any }

  constructor() {
    super();
    this.buffer = [];
    this.ptr = 0;
    this.memos = {};
  }

  static decode(buffer : SuperPackedValue, options? : { extensions? : ExtensionMap } = {}) : any {
    let d = new Decoder;
    const extensions = options.extensions;
    if (extensions != null) {
      // $FlowFixMe: flow doesn't understand that ext is an ExtensionPoint
      Object.keys(extensions).forEach((ext : ExtensionPoint) => {
        d.extend(ext, extensions[ext]);
      });
    }
    return d.decode(buffer);
  }

  decode(buffer : SuperPackedValue) : any {
    this.buffer = buffer;
    this.initialiseExtensions();

    Object.keys(this.extensions).map(e => +e).sort()
      .filter(e => typeof this.extensions[e].memo === 'function')
      .forEach(e => {
        this.memos[e] = this.decodeValue();
      });

    return this.decodeValue();
  }

  readUInt32() {
    return this.buffer[this.ptr++] * 0x1000000 + (this.buffer[this.ptr++] << 16 | this.buffer[this.ptr++] << 8 | this.buffer[this.ptr++]);
  }

  readFloat(eBits : 8 | 11, mBits : 23 | 52) {
    let bias = (1 << (eBits - 1)) - 1;
    let byteLength = (eBits + mBits + 1) / 8;

    let bytes = this.buffer.slice(this.ptr, this.ptr + byteLength);
    this.ptr += byteLength;

    // read sign, exponent, and beginning of mantissa from first two bytes
    let sign = (bytes[0] >>> 7) > 0 ? -1 : 1;
    let leadingBytes = (bytes[0] << 8) | bytes[1];
    let leadingMBits = 16 - (eBits + 1);
    let exp = (leadingBytes >>> leadingMBits) & ((1 << eBits) - 1);
    let mantissa = leadingBytes & ((1 << leadingMBits) - 1);

    // read remainder of mantissa
    for (let i = 2; i < byteLength; ++i) {
      mantissa = mantissa * 256 + bytes[i];
    }

    if (exp === (1 << eBits) - 1) {
      // NaN and +/- Infinity
      return (mantissa === 0 ? sign : 0) / 0;
    } else if (exp > 0) {
      // normal
      return sign * Math.pow(2, exp - bias) * (1 + mantissa / Math.pow(2, mBits));
    } else if (mantissa !== 0) {
      // subnormal
      return sign * Math.pow(2, -(bias - 1)) * (mantissa / Math.pow(2, mBits));
    }
    return sign * 0;
  }

  readString(length: number) {
    let str = '';
    for (let i = 0; i < length; ++i) {
      str += String.fromCharCode(this.buffer[this.ptr++]);
    }
    return decodeURIComponent(escape(str));
  }

  readArray(length: number): any {
    let out = [];
    for (let i = 0; i < length; ++i) {
      out.push(this.decodeValue());
    }
    return out;
  }

  readBooleanArray(length: number): any {
    let out = [];
    for (let i = 0; i < length; ++i) {
      out[i] = (this.buffer[this.ptr + (i >> 3)] & (0x80 >> (i % 8))) > 0;
    }
    this.ptr += (length >> 3) + (length % 8 !== 0);
    return out;
  }

  // todo: factor out "read type_ length value"
  // readUInt() { ... }

  decodeValue(): any {
    let type = this.buffer[this.ptr++];
    if (within(type, tags.UINT6_BASE, 6)) {
      return type - tags.UINT6_BASE;
    } else if (within(type, tags.UINT14_BASE, 6)) {
      return (type - tags.UINT14_BASE) << 8 | this.buffer[this.ptr++];
    } else if (within(type, tags.NINT4_BASE, 4)) {
      return -(type - tags.NINT4_BASE);
    } else if (within(type, tags.BARRAY4_BASE, 4)) {
      return this.readBooleanArray(type - tags.BARRAY4_BASE);
    } else if (within(type, tags.ARRAY5_BASE, 5)) {
      return this.readArray(type - tags.ARRAY5_BASE);
    } else if (within(type, tags.STR5_BASE, 5)) {
      return this.readString(type - tags.STR5_BASE);
    } else if (within(type, tags.EXTENSION3_BASE, 3)) {
      let ext : ExtensionPoint = type - tags.EXTENSION3_BASE;
      return this.extensions[ext].deserialise(this.decodeValue(), this.memos[ext]);
    }
    switch (type) {
      case tags.FALSE: return false;
      case tags.TRUE: return true;
      case tags.NULL: return null;
      case tags.UNDEFINED: return void 0;
      case tags.UINT16:
        return (this.buffer[this.ptr++]) << 8 | this.buffer[this.ptr++];
      case tags.UINT24:
        return (this.buffer[this.ptr++]) << 16 | (this.buffer[this.ptr++]) << 8 | this.buffer[this.ptr++];
      case tags.UINT32:
        return this.readUInt32();
      case tags.UINT64:
        return this.readUInt32() * 0x100000000 + this.readUInt32();
      case tags.NINT8:
        return -(this.buffer[this.ptr++]);
      case tags.NINT16:
        return -((this.buffer[this.ptr++]) << 8 | this.buffer[this.ptr++]);
      case tags.NINT32:
        return -this.readUInt32();
      case tags.NINT64:
        return -(this.readUInt32() * 0x100000000 + this.readUInt32());
      case tags.FLOAT32:
        return this.readFloat(8, 23);
      case tags.DOUBLE64:
        return this.readFloat(11, 52);

      case tags.TIMESTAMP:
        return new Date(
          (this.buffer[this.ptr] & 0x80) > 0
            ? -(
                (~(this.buffer[this.ptr++] << 16 | this.buffer[this.ptr++] << 8 | this.buffer[this.ptr++]) & 0xFFFFFF) * 0x1000000 +
                (~(this.buffer[this.ptr++] << 16 | this.buffer[this.ptr++] << 8 | this.buffer[this.ptr++]) & 0xFFFFFF) + 1
              )
            : (this.buffer[this.ptr++] << 16 | this.buffer[this.ptr++] << 8 | this.buffer[this.ptr++]) * 0x1000000 +
              (this.buffer[this.ptr++] << 16 | this.buffer[this.ptr++] << 8 | this.buffer[this.ptr++])
        );

      case tags.BINARY_: {
        let length: number = this.decodeValue();
        let out = new Uint8Array(length);
        for (let i = 0; i < length; ++i) {
          out[i] = this.buffer[this.ptr + i];
        }
        this.ptr += length;
        return out.buffer;
      }

      case tags.CSTRING: {
        let str = '';
        while (this.buffer[this.ptr] !== 0) {
          str += String.fromCharCode(this.buffer[this.ptr++]);
        }
        this.ptr++;
        return decodeURIComponent(escape(str));
      }
      case tags.STR_:
        return this.readString(this.decodeValue());

      case tags.ARRAY_:
        return this.readArray(this.decodeValue());

      case tags.BARRAY_:
        return this.readBooleanArray(this.decodeValue());

      case tags.MAP: {
        let out = {};
        let keys = (this.decodeValue() : Array<string>);
        keys.forEach((key) => {
          out[key] = this.decodeValue();
        });
        return out;
      }

      case tags.BMAP: {
        let out = {};
        let keys = (this.decodeValue() : Array<string>);
        let bools = this.readBooleanArray(keys.length);
        for (let i = 0; i < keys.length; ++i) {
          out[keys[i]] = bools[i];
        }
        return out;
      }

      case tags.EXTENSION: {
        let ext : ExtensionPoint = this.decodeValue();
        return this.extensions[ext].deserialise(this.decodeValue(), this.memos[ext]);
      }

      default:
        // This should never happen.
        /* istanbul ignore next */
        throw new Error('Unknown case');
    }
  }
}

export const decode = Decoder.decode;
