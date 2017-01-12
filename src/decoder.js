import tags from './type-tags.js';

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
factor out various common threads
*/

let stringLUT: Array<string>, keysetLUT, ptr: number;

export default function decode(buf: Array<number>): any {
  ptr = 0;
  if (buf[0] === tags.STRLUT) {
    stringLUT = decodeValue(buf);
    keysetLUT = decodeValue(buf);
  } else {
    stringLUT = [];
    keysetLUT = [];
  }
  return decodeValue(buf);
}

function readUInt32(buf) {
  return buf[ptr++] * 0x1000000 + (buf[ptr++] << 16 | buf[ptr++] << 8 | buf[ptr++]);
}

function readFloat(buf, eBits, mBits) {
  let bias = (1 << (eBits - 1)) - 1;
  let byteLength = (eBits + mBits + 1) / 8;

  let bytes = buf.slice(ptr, ptr + byteLength);
  ptr += byteLength;

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

function readString(buf, length: number) {
  let str = '';
  for (let i = 0; i < length; ++i) {
    str += String.fromCharCode(buf[ptr++]);
  }
  // $FlowFixMe: flow doesn't know about escape yet
  return decodeURIComponent(escape(str));
}

function readArray(buf, length: number): any {
  let out = [];
  for (let i = 0; i < length; ++i) {
    out.push(decodeValue(buf));
  }
  return out;
}

function readBooleanArray(buf, length: number): any {
  let out = [];
  for (let i = 0; i < length; ++i) {
    out[i] = (buf[ptr + (i >> 3)] & (0x80 >> (i % 8))) > 0;
  }
  ptr += (length >> 3) + (length % 8 !== 0);
  return out;
}

// todo: factor out "read type_ length value"
// function readUInt(buf) {

function decodeValue(buf): any {
  let type = buf[ptr++];
  if (type < tags.UINT14_BASE) {
    return type;
  } else if (type < tags.NINT4_BASE) {
    return (type ^ tags.UINT14_BASE) << 8 | buf[ptr++];
  } else if (type < tags.BARRAY4_BASE) {
    return -(type ^ tags.NINT4_BASE);
  } else if (type < tags.ARRAY5_BASE) {
    return readBooleanArray(buf, type ^ tags.BARRAY4_BASE);
  } else if (type < tags.STR5_BASE) {
    return readArray(buf, type ^ tags.ARRAY5_BASE);
  } else if (type < tags.FALSE) {
    return readString(buf, type ^ tags.STR5_BASE);
  }
  switch (type) {
    case tags.FALSE: return false;
    case tags.TRUE: return true;
    case tags.NULL: return null;
    case tags.UNDEFINED: return void 0;
    case tags.UINT16:
      return (buf[ptr++]) << 8 | buf[ptr++];
    case tags.UINT24:
      return (buf[ptr++]) << 16 | (buf[ptr++]) << 8 | buf[ptr++];
    case tags.UINT32:
      return readUInt32(buf);
    case tags.UINT64:
      return readUInt32(buf) * 0x100000000 + readUInt32(buf);
    case tags.NINT8:
      return -(buf[ptr++]);
    case tags.NINT16:
      return -((buf[ptr++]) << 8 | buf[ptr++]);
    case tags.NINT32:
      return -readUInt32(buf);
    case tags.NINT64:
      return -(readUInt32(buf) * 0x100000000 + readUInt32(buf));
    case tags.FLOAT32:
      return readFloat(buf, 8, 23);
    case tags.DOUBLE64:
      return readFloat(buf, 11, 52);

    case tags.TIMESTAMP:
      return new Date(
        (buf[ptr] & 0x80) > 0
          ? -(
              (~(buf[ptr++] << 16 | buf[ptr++] << 8 | buf[ptr++]) & 0xFFFFFF) * 0x1000000 +
              (~(buf[ptr++] << 16 | buf[ptr++] << 8 | buf[ptr++]) & 0xFFFFFF) + 1
            )
          : (buf[ptr++] << 16 | buf[ptr++] << 8 | buf[ptr++]) * 0x1000000 +
            (buf[ptr++] << 16 | buf[ptr++] << 8 | buf[ptr++])
      );

    case tags.BINARY_: {
      let length: number = decodeValue(buf);
      // alternative to Uint8Array.from(...) for old browsers
      let out = new Uint8Array;
      for (let i = 0; i < length; ++i) {
        out[i] = buf[ptr + i];
      }
      ptr += length;
      return out.buffer;
    }

    case tags.CSTRING: {
      let str = '';
      while (buf[ptr] !== 0) {
        str += String.fromCharCode(buf[ptr++]);
      }
      ptr++;
      // $FlowFixMe: flow doesn't know about escape yet
      return decodeURIComponent(escape(str));
    }
    case tags.STR8:
      return readString(buf, buf[ptr++]);
    case tags.STR_:
      return readString(buf, decodeValue(buf));
    case tags.STRREF:
      return stringLUT[buf[ptr++]];

    case tags.ARRAY8:
    case tags.STRLUT:
      return readArray(buf, buf[ptr++]);
    case tags.ARRAY_:
      return readArray(buf, decodeValue(buf));

    case tags.BARRAY8:
      return readBooleanArray(buf, buf[ptr++]);
    case tags.BARRAY_:
      return readBooleanArray(buf, decodeValue(buf));

    case tags.MAP_: {
      let out = {};
      let keysetIndex = decodeValue(buf);
      let keys = keysetLUT[keysetIndex];
      keys.forEach(function (key) {
        out[key] = decodeValue(buf);
      });
      return out;
    }

    case tags.BMAP_: {
      let out = {};
      let keysetIndex = decodeValue(buf);
      let keys = keysetLUT[keysetIndex];
      let bools = readBooleanArray(buf, keys.length);
      for (let i = 0; i < keys.length; ++i) {
        out[keys[i]] = bools[i];
      }
      return out;
    }

    default:
      // This should never happen.
      throw new Error('Unknown case');
  }
}
