// @flow

import type { Extension } from './extendable.js';

export const depthBoundReached = {};
export const extension : Extension = {
  detector: () => false,
  serialiser: () => {
    throw new Error('serialisation is hard-coded into the encoder');
  },
  deserialiser: () => depthBoundReached,
};
