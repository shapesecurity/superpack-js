import Encoder from './encoder.js';
import Decoder from './decoder.js';

export default class Transcoder {
  static encode : (value : any, options : any) => Array<number | string>
  static decode : (buffer : Array<number>, options : any) => any
  encoder : Encoder
  decoder : Decoder

  constructor() {
    this.encoder = new Encoder;
    this.decoder = new Decoder;
  }

  encode(...args : any) {
    return this.encoder.encode(...args);
  }

  decode(...args : any) {
    return this.decoder.decode(...args);
  }
}

Transcoder.encode = Encoder.encode;
Transcoder.decode = Decoder.decode;

export const encode = Encoder.encode;
export const decode = Decoder.decode;
