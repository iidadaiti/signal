import { describe, it, expect } from "vitest";
import { createSignal } from "./signal";

describe("createSignal", () => {
  it("should initialize the signal with the value passed as an argument", () => {
    const value = 42;
    const [get] = createSignal(value);
    expect(get()).toBe(value);
  });

  it("should not reference the argument when setting the signal value", () => {
    const value = { value: 42 };
    const [get] = createSignal(value);
    value.value = 43;
    expect(get()).not.toEqual(value);
  });

  it("should not reference the obtained value", () => {
    const [get] = createSignal({ value: 42 });
    const value = get();
    value.value = 43;
    expect(get()).not.toEqual(value);
  });

  it("should update value when setter is called", () => {
    const [get, set] = createSignal(10);

    const value = 42;
    set(value);
    expect(get()).toBe(value);
  });

  it("should not reference the value passed to the setter when updating the signal", () => {
    const [get, set] = createSignal();
    const value = { value: 42 };
    set(value);

    value.value = 43;
    expect(get()).not.toEqual(value);
  });
});
