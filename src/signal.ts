export type Getter<Value> = () => Value;
export type Setter<Value> = (value: Value) => void;
export type Signal<GetValue, SetValue extends GetValue = GetValue> = [
  Getter<GetValue>,
  Setter<SetValue>
];
export type Handler = () => void;

interface DataNode<Value> {
  value: Value;
  handlers: Set<Handler>;
}

interface EffectNode {
  handler: Handler;
  dataNodes: Set<DataNode<unknown>>;
  parentEffectNodes: Set<EffectNode>;
  childEffectNodes: Set<EffectNode>;
}

let effectNodeContext: EffectNode | undefined;

function createDataNode<Value>(value: Value): DataNode<Value> {
  const handlers = new Set<Handler>();
  return { value: structuredClone(value), handlers };
}

function createCleanupEffect(effectNode: EffectNode): () => void {
  return function cleanup() {
    for (const dataNode of effectNode.dataNodes) {
      dataNode.handlers.delete(effectNode.handler);
    }

    for (const childEffectNode of effectNode.childEffectNodes) {
      createCleanupEffect(childEffectNode)();
    }

    for (const parentEffectNode of effectNode.parentEffectNodes) {
      parentEffectNode.childEffectNodes.delete(effectNode);
    }
  };
}

function createEffectNode(handler: Handler): EffectNode {
  const dataNodes = new Set<DataNode<unknown>>();
  const childEffectNodes = new Set<EffectNode>();
  const parentEffectNodes = new Set<EffectNode>();
  const effectNode: EffectNode = {
    dataNodes,
    childEffectNodes,
    parentEffectNodes,
    handler: () => {
      if (effectNodeContext) {
        effectNodeContext.childEffectNodes.add(effectNode);
        effectNode.parentEffectNodes.add(effectNodeContext);
      }

      const beforeEffectNodeContext = effectNodeContext;
      const beforeGotDataNodes = new Set(effectNode.dataNodes);
      const beforeEffectNodes = new Set(effectNode.childEffectNodes);
      effectNode.dataNodes.clear();
      effectNode.childEffectNodes.clear();
      effectNodeContext = effectNode;
      handler();
      for (const beforeGotDataNode of beforeGotDataNodes) {
        if (!effectNode.dataNodes.has(beforeGotDataNode)) {
          beforeGotDataNode.handlers.delete(effectNode.handler);
        }
      }

      for (const beforeEffectNode of beforeEffectNodes) {
        if (!effectNode.childEffectNodes.has(beforeEffectNode)) {
          createCleanupEffect(beforeEffectNode)();
        }
      }
      effectNodeContext = beforeEffectNodeContext;
    },
  };

  return effectNode;
}

function createGetter<Value>(dataNode: DataNode<Value>): Getter<Value> {
  return function getter() {
    if (effectNodeContext) {
      effectNodeContext.dataNodes.add(dataNode);
      dataNode.handlers.add(effectNodeContext.handler);
    }
    return structuredClone(dataNode.value);
  };
}

function createSetter<GetValue, SetValue extends GetValue = GetValue>(
  dataNode: DataNode<GetValue>
): Setter<SetValue> {
  return function setter(value: SetValue) {
    dataNode.value = structuredClone(value);
    for (const handler of dataNode.handlers) {
      handler();
    }
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

export function createEffect(handler: Handler): () => void {
  const effectNode = createEffectNode(handler);
  effectNode.handler();
  const cleanup = createCleanupEffect(effectNode);
  return cleanup;
}
