/* global Class */

export type ExtensionPoint = number;

class Extension {
  detector : any => boolean
  serialiser : any => any
  deserialiser : (a : any, memo : ?any) => any
  memo : ?(() => any)
}

export type ExtensionMap = {
  [extensionPoint : ExtensionPoint] : Class<Extension>,
};

export default class Extendable {
  extensionCtors : ExtensionMap

  extensions : {
    [extensionPoint : ExtensionPoint] : Extension,
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

  extend(extensionPoint : ExtensionPoint, extension : Class<Extension>) {
    this.extensionCtors[extensionPoint] = extension;
  }
}
