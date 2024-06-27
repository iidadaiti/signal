import { describe, it, expect, vi } from "vitest";
import { createEffect, createSignal } from "./signal";

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
    const [get, set] = createSignal(42);
    const value = 43;
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

describe("createEffect", () => {
  it("should execute createEffect once when created", () => {
    const handler = vi.fn();
    createEffect(handler);
    expect(handler).toBeCalledTimes(1);
  });

  it("should recalculate when the value is updated", () => {
    const [get, set] = createSignal(42);
    const handler = vi.fn(() => {
      get();
    });

    createEffect(handler);
    set(43);

    expect(handler).toBeCalledTimes(2);
  });

  it("should execute nested effects", () => {
    const [get, set] = createSignal(42);
    const handler = vi.fn();

    createEffect(() => {
      get();
      createEffect(handler);
    });
    set(43);

    expect(handler).toBeCalledTimes(2);
  });

  it("should not register the same handler multiple times", () => {
    const [get, set] = createSignal(42);
    const handler = vi.fn(() => {
      get();
      get();
    });

    createEffect(handler);
    set(43);

    expect(handler).toBeCalledTimes(2);
  });

  it("should not refire effects that have been cleaned up", () => {
    const [get, set] = createSignal(42);
    const handler = vi.fn(() => {
      get();
    });

    const cleanup = createEffect(handler);
    cleanup();
    set(43);

    expect(handler).toBeCalledTimes(1);
  });

  it("should automatically clean up the effects", () => {
    const [getFlag, setFlag] = createSignal(true);
    const [getValue, setValue] = createSignal(42);

    const handler = vi.fn(() => {
      if (getFlag()) {
        getValue();
      }
    });
    createEffect(handler);
    setValue(43);
    setFlag(false);
    setValue(44);

    expect(handler).toBeCalledTimes(3);
  });

  it("should unsubscribe from dataNode when it's no longer relevant", () => {
    const [getFlag, setFlag] = createSignal(true);
    const [getValue, setValue] = createSignal(42);

    const handler = vi.fn(() => {
      if (getFlag()) {
        getValue();
      }
    });
    createEffect(handler);
    setValue(43);
    setFlag(false);
    setValue(44);

    expect(handler).toBeCalledTimes(3);
  });

  it("should automatically clean up the effects", () => {
    const [getFlag, setFlag] = createSignal(true);
    const [getValue, setValue] = createSignal(42);

    const handler = vi.fn(() => {
      getValue();
    });

    createEffect(() => {
      if (getFlag()) {
        createEffect(handler);
      }
    });
    setValue(43);
    setFlag(false);
    setValue(44);

    expect(handler).toBeCalledTimes(2);
  });
});
