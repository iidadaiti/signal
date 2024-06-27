export type Getter<Value> = () => Value;
export type Setter<Value> = (value: Value) => void;
export type Signal<GetValue, SetValue extends GetValue = GetValue> = [
  Getter<GetValue>,
  Setter<SetValue>
];
export type Effect = () => void;

interface DataNode<Value> {
  value: Value;
  effects: Set<Effect>;
}

interface EffectNode {
  effect: Effect;
  cleanup: () => void;
  dataNodes: Set<DataNode<unknown>>;
  parentEffectNodes: Set<EffectNode>;
  childEffectNodes: Set<EffectNode>;
}

let batchContext: Set<Effect> | undefined;
let effectNodeContext: EffectNode | undefined;

function createDataNode<Value>(value: Value): DataNode<Value> {
  const effects = new Set<Effect>();
  return { value: structuredClone(value), effects };
}

function createEffectNode(effect: Effect): EffectNode {
  const dataNodes = new Set<DataNode<unknown>>();
  const childEffectNodes = new Set<EffectNode>();
  const parentEffectNodes = new Set<EffectNode>();
  const effectNode: EffectNode = {
    dataNodes,
    childEffectNodes,
    parentEffectNodes,
    cleanup: () => {
      for (const dataNode of effectNode.dataNodes) {
        dataNode.effects.delete(effectNode.effect);
      }

      for (const childEffectNode of effectNode.childEffectNodes) {
        childEffectNode.cleanup();
      }

      for (const parentEffectNode of effectNode.parentEffectNodes) {
        parentEffectNode.childEffectNodes.delete(effectNode);
      }
    },
    effect: () => {
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
      effect();
      for (const beforeGotDataNode of beforeGotDataNodes) {
        if (!effectNode.dataNodes.has(beforeGotDataNode)) {
          beforeGotDataNode.effects.delete(effectNode.effect);
        }
      }

      for (const beforeEffectNode of beforeEffectNodes) {
        if (!effectNode.childEffectNodes.has(beforeEffectNode)) {
          beforeEffectNode.cleanup();
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
      dataNode.effects.add(effectNodeContext.effect);
    }
    return structuredClone(dataNode.value);
  };
}

function createSetter<GetValue, SetValue extends GetValue = GetValue>(
  dataNode: DataNode<GetValue>
): Setter<SetValue> {
  return function setter(value: SetValue) {
    dataNode.value = structuredClone(value);
    for (const effect of dataNode.effects) {
      if (batchContext) {
        batchContext.add(effect);
      } else {
        effect();
      }
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

export function createEffect(effect: Effect): () => void {
  const effectNode = createEffectNode(effect);
  effectNode.effect();
  return function cleanup() {
    effectNode.cleanup();
  };
}

export function createBatch(fn: () => void): void {
  const batch = batchContext ?? new Set<Effect>();
  const beforeBatchContext = batchContext;
  batchContext = batch;
  fn();
  batchContext = beforeBatchContext;

  if (!beforeBatchContext) {
    for (const effect of batch) {
      effect();
    }
  }
}
