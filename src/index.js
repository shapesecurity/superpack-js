// @flow
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

  extend(...args : any) : void {
    this.encoder.extend(...args);
    this.decoder.extend(...args);
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

export { default as Encoder, encode } from './encoder.js';
export { default as Decoder, decode } from './decoder.js';
