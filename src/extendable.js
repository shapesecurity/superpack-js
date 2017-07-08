/* global Class */

export type ExtensionPoint = number;

export interface Extension<-A, -B, +Memo = void> {
  detector : any => boolean,
  serialiser : A => B,
  deserialiser : (x : B, memo : Memo) => A,
  memo : ?(() => Memo),
}

export type ExtensionMap = {
  [extensionPoint : ExtensionPoint] : Class<Extension<any, any, any>>,
};

export default class Extendable {
  extensionCtors : ExtensionMap

  extensions : {
    [extensionPoint : ExtensionPoint] : Extension<any, any, any>,
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

  extend(extensionPoint : ExtensionPoint, extension : Class<Extension<any, any, any>>) {
    this.extensionCtors[extensionPoint] = extension;
  }
}
