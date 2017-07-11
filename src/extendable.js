/* global Class */

export type ExtensionPoint = number;

export interface Extension<-A, -B, +Memo = void> {
  constructor(): Extension<A, B, Memo>;
  isCandidate(any) : boolean;
  +shouldSerialise: ?(A => boolean);
  serialise(A) : B;
  deserialise(x : B, memo : Memo) : A;
  +memo: ?(() => Memo);
}

export type ExtensionMap = {
  [extensionPoint : ExtensionPoint] : Class<Extension<*, *, *>>,
};

export default class Extendable {
  extensionCtors : ExtensionMap

  extensions : {
    [extensionPoint : ExtensionPoint] : Extension<*, *, *>,
  }

  constructor() {
    this.extensionCtors = Object.create(null);
    this.extensions = Object.create(null);
  }

  initialiseExtensions() {
    Object.keys(this.extensionCtors).forEach(e => {
      this.extensions[+e] = new this.extensionCtors[+e];
    });
  }

  extend(extensionPoint : ExtensionPoint, extension : Class<Extension<*, *, *>>) {
    this.extensionCtors[extensionPoint] = extension;
  }
}
