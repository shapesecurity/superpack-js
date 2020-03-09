export type ExtensionPoint = number;

export type Extension = {
  detector : any => boolean,
  serialiser : any => any,
  deserialiser : any => any,
};

export type ExtensionMap = {
  [extensionPoint : ExtensionPoint] : Extension,
};

export default class Extendable {
  extensions : ExtensionMap

  constructor() {
    this.extensions = Object.create(null);
  }

  extend(extensionPoint : ExtensionPoint, detector : any => boolean, serialiser : any => any, deserialiser : any => any) : void {
    this.extensions[extensionPoint] = { detector, serialiser, deserialiser };
  }
}
