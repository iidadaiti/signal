# Signal

Simple Reactive library

## Examples

```typescript
import { createSignal, createEffect } from "signal";

const [get, set] = createSignal("Hello World!");

const cleanup = createEffect(() => {
  console.log(get());
}); // Hello World!

set("Hello Signal!"); // Hello Signal!

cleanup();
```

nest effect

```typescript
import { createSignal, createEffect } from "signal";

const [getName, setName] = createSignal("Alice");
const [getState, setState] = createSignal("sleep");

const cleanup = createEffect(() => {
  console.log(`set name ${getName()}`);

  createEffect(() => {
    console.log(`${getName()} is ${getState()}`);
  });
}); // log is 'set name Alice' and 'Alice is sleep'

setString1("Bell"); // log is 'set name Bell' and 'Bell is sleep'
setString2("smile"); // log is 'Alice is smile'

cleanup(); // nest effect is auto cleanup!
```

batch

```typescript
import { createSignal, createEffect, createBatch } from "signal";

const [getString1, setString1] = createSignal("Hello");
const [getString2, setString2] = createSignal("World");

const cleanup = createEffect(() => {
  console.log(`${getString1()} ${getString2()}!`);
}); // Hello World!

createBatch(() => {
  setString1("Goodmorning");
  setString2("Signal");
}); // Goodmorning Signal!

cleanup();
```
