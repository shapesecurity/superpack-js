// @flow
/* global Uint8Array */

import tags from './type-tags.js';
import Extendable from './extendable.js';
import type { ExtensionMap, ExtensionPoint } from './extendable.js';

type SuperPackedValue = Array<number>;
type Keyset = Array<string>;

/*
todo:
mapl, bmapl
timestamp
extension
factor out various common threads
*/

export default class Decoder extends Extendable {
  strings: Array<string>
  keysets: Array<Keyset>
  buffer : SuperPackedValue
  ptr : number
  memos : { [e : ExtensionPoint] : any }

  constructor() {
    super();
    this.strings = [];
    this.keysets = [];
    this.buffer = [];
    this.ptr = 0;
    this.memos = {};
  }

  static decode(buffer : SuperPackedValue, options? : { omittedKeysets? : Array<Keyset>, extensions? : ExtensionMap } = {}) : any {
    let d = new Decoder;
    const extensions = options.extensions;
    if (extensions != null) {
      // $FlowFixMe: flow doesn't understand that ext is an ExtensionPoint
      Object.keys(extensions).forEach((ext : ExtensionPoint) => {
        let extension = extensions[ext];
        d.extend(ext, extension.detector, extension.serialiser, extension.deserialiser, extension.memo);
      });
    }
    return d.decode(buffer, options);
  }

  decode(buffer : SuperPackedValue, options? : { omittedKeysets? : Array<Keyset> } = {}) : any {
    this.buffer = buffer;

    if (buffer[0] === tags.STRLUT) {
      this.strings = (this.decodeValue(): Array<string>);
      this.keysets = (this.decodeValue(): Array<Keyset>);
    }

    if (options.omittedKeysets != null) {
      let k = [];
      [].push.apply(k, options.omittedKeysets);
      [].push.apply(k, this.keysets);
      this.keysets = k;
    }

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
      out.push(this.decodeValue(this.buffer));
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
    if (type < tags.UINT14_BASE) {
      return type;
    } else if (type < tags.NINT4_BASE) {
      return (type ^ tags.UINT14_BASE) << 8 | this.buffer[this.ptr++];
    } else if (type < tags.BARRAY4_BASE) {
      return -(type ^ tags.NINT4_BASE);
    } else if (type < tags.ARRAY5_BASE) {
      return this.readBooleanArray(type ^ tags.BARRAY4_BASE);
    } else if (type < tags.STR5_BASE) {
      return this.readArray(type ^ tags.ARRAY5_BASE);
    } else if (type < tags.FALSE) {
      return this.readString(type ^ tags.STR5_BASE);
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
        // alternative to Uint8Array.from(...) for old browsers
        let out = new Uint8Array;
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
      case tags.STR8:
        return this.readString(this.buffer[this.ptr++]);
      case tags.STR_:
        return this.readString(this.decodeValue());
      case tags.STRREF:
        return this.strings[this.buffer[this.ptr++]];

      case tags.ARRAY8:
      case tags.STRLUT:
        return this.readArray(this.buffer[this.ptr++]);
      case tags.ARRAY_:
        return this.readArray(this.decodeValue());

      case tags.BARRAY8:
        return this.readBooleanArray(this.buffer[this.ptr++]);
      case tags.BARRAY_:
        return this.readBooleanArray(this.decodeValue());

      case tags.MAP_: {
        let out = {};
        let keysetIndex = this.decodeValue();
        let keys = this.keysets[keysetIndex];
        keys.forEach((key) => {
          out[key] = this.decodeValue();
        });
        return out;
      }

      case tags.BMAP_: {
        let out = {};
        let keysetIndex = this.decodeValue();
        let keys = this.keysets[keysetIndex];
        let bools = this.readBooleanArray(keys.length);
        for (let i = 0; i < keys.length; ++i) {
          out[keys[i]] = bools[i];
        }
        return out;
      }

      case tags.EXTENSION: {
        let ext : ExtensionPoint = this.decodeValue();
        return this.extensions[ext].deserialiser(this.decodeValue(), this.memos[ext]);
      }

      default:
        // This should never happen.
        throw new Error('Unknown case');
    }
  }
}

export const decode = Decoder.decode;
