SuperPack (JS)
==============

## About

This module provides a transcoder for the [SuperPack binary encoding format](https://github.com/shapesecurity/superpack-spec).

## Status

[Experimental](http://nodejs.org/api/documentation.html#documentation_stability_index).


## Installation

```sh
npm install superpack
```


## Usage

```js
import {encode, decode} from "superpack";
let payload = encode(/* your SuperPack-serialisable value */);
let reconstructedValue = decode(payload);
```

## Extensions

`encode` and `decode` take a second argument which is an options bag. It allows specifying extensions as follows:

```js
encode(data, {
  extensions: {
    [extensionPoint]: {
      detector: value => false,
      serialiser: value => serialize(value),
      deserialiser: serializedValue => deserialise(serializedValue),
    }
  }
});
````

where `extensionPoint` is a number. The decoder must have the same extensions at the same extension points.


## Depth bound extension

This implementation includes a buit-in extension which allows bounding the depth of object / array nesting allowed. Once reached, a sigil value is emitted instead. It is used as

```js
import {encode, depthBoundExtensionPoint, depthBoundExtension} from "superpack";
encode(data, {
  depthBound: 2,
  extensions: {
    [depthBoundExtensionPoint]: depthBoundExtension
  }
});
```


## Contributing

* Open a Github issue with a description of your desired change. If one exists already, leave a message stating that you are working on it with the date you expect it to be complete.
* Fork this repo, and clone the forked repo.
* Install dependencies with `npm install`.
* Test in your environment with `npm test`.
* Create a feature branch. Make your changes. Add tests.
* Test in your environment with `npm test`.
* Make a commit that includes the text "fixes #*XX*" where *XX* is the Github issue.
* Open a Pull Request on Github.


## License

    Copyright 2016 Shape Security, Inc.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
