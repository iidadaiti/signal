export type Getter<Value> = () => Value;
export type Setter<Value> = (value: Value) => void;
export type Signal<GetValue, SetValue extends GetValue = GetValue> = [
  Getter<GetValue>,
  Setter<SetValue>
];

interface DataNode<Value> {
  value: Value;
}

function createDataNode<Value>(value: Value): DataNode<Value> {
  return { value: structuredClone(value) };
}

function createGetter<Value>(dataNode: DataNode<Value>): Getter<Value> {
  return function getter() {
    return structuredClone(dataNode.value);
  };
}

function createSetter<GetValue, SetValue extends GetValue = GetValue>(
  dataNode: DataNode<GetValue>
): Setter<SetValue> {
  return function setter(value: SetValue) {
    dataNode.value = structuredClone(value);
  };
}

export function createSignal<Value>(value: Value): Signal<Value, Value>;
export function createSignal<
  GetValue = unknown,
  SetValue extends GetValue | undefined = GetValue
>(value?: GetValue | undefined): Signal<GetValue | undefined, SetValue>;
export function createSignal<
  GetValue = unknown,
  SetValue extends GetValue | undefined = GetValue | undefined
>(value?: GetValue | undefined): Signal<GetValue | undefined, SetValue> {
  const dataNode = createDataNode(value);
  const getter = createGetter(dataNode);
  const setter = createSetter(dataNode);
  return [getter, setter];
}
