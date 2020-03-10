// @flow

import type { Extension } from './extendable.js';

export const depthBoundReached = {};
export const extension : Extension = {
  detector: () => false,
  serialiser: () => {
    throw new Error('serialization is hardcoded into the encoder');
  },
  deserialiser: () => depthBoundReached,
};
