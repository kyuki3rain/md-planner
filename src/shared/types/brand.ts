export type Brand<Value, Identifier extends string> = Value & {
  readonly __brand: Identifier;
};

export type Branded<Value, Identifier extends string> = Brand<Value, Identifier>;
