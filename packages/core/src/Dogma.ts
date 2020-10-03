/// <reference types="reflect-metadata" />
import { TupleIndexes, NormalizeTuple } from './normalize-tuple';
import { DogmaNullable, DogmaNullableMember } from './DogmaNullable';
import { Serializer } from './Serializer';
import { JSONSerializer } from './JSONSerializer';
import { isEnum } from './utils';

const $dogma$ = Symbol.for('Dogma.$dogma$');
const enumerators: any = {};

export type PropertiesForgeable<T> = T extends { [$dogma$]: any; new(...args: any[]): any } ? T : never;

export type IsProperty<T> = Exclude<T, null | undefined> extends never
  ? false
  : Exclude<T, null | undefined> extends PropertyDefinition
    ? true
    : false;

export type PropertyKeys<T> = Exclude<{ [K in keyof T]-?: IsProperty<T[K]> extends true ? K : null }[keyof T], null>;

export type PropertyDefinitions<T> = {
  [K in PropertyKeys<T>]: Exclude<T[K], null | undefined> extends PropertyDefinition<infer U>
    ? U
    : (RequiredPropertyDefinition | OptionalNullablePropertyDefinition | OptionalPropertyDefinition | NullablePropertyDefinition)
};

export type IsAbstractClass<T extends { prototype: any }> = T extends { new(...args: any[]): any }
  ? false
  : true;

export type TupleItemKey<T, K> = T extends { index: TupleIndexes }
  ? K extends string ? { [K2 in T['index']]: {[K2 in K]: null }  } : {}
  : {};

export type TupleItemKeySingle<T, K> = T extends { index: TupleIndexes }
  ? K extends string ? { [K2 in T['index']]: K[]  } : {}
  : {};

type Merge<T> = { [K in keyof T]: { (args: T[K]): void } }[keyof T] extends { (args: infer U): void }
  ? { [K in keyof U]: U[K] }
  : {};

type MergeDeep<T> = { [K in keyof T]: { (args: T[K]): void } }[keyof T] extends { (args: infer U): void }
  ? { [K in keyof U]: keyof U[K] }
  : {};

type MergeAnother<T> = { [K in keyof T]: { (args: T[K]): void } }[keyof T] extends { (args: infer U): void }
  ? { [K in keyof U]: U[K] extends (infer F)[] ? F : never }
  : {};

export type MakeTupleKey<T> = MergeDeep<{ [K in keyof PropertyDefinitions<T>]: TupleItemKey<PropertyDefinitions<T>[K], K> }>;
export type MakeTupleKeySingle<T> = MergeAnother<{ [K in keyof PropertyDefinitions<T>]: TupleItemKeySingle<PropertyDefinitions<T>[K], K> }>;
export type FindRepeatedIndex<T> = Exclude<{ [K in keyof MakeTupleKey<T>]: K extends keyof MakeTupleKeySingle<T> ? MakeTupleKey<T>[K] extends MakeTupleKeySingle<T>[K] ? null : [K, MakeTupleKeySingle<T>[K], Exclude<MakeTupleKey<T>[K], MakeTupleKeySingle<T>[K]>] : null }[keyof MakeTupleKey<T>], null>;
export type PropertyLikely<T> = IsProperty<T> extends true ? any : PropertyDefinition;
export type AbstractProperties<T> = { [K in Exclude<keyof T, '__propertyKeys'>]?: PropertyLikely<T[K]> };
export type PropertiesClass<T = {}> = Function & { prototype: AbstractProperties<T> }
export type ClassMustExtendDogmaObject = { __ItMustExtendDogmaObject?: undefined };
export type ClassMustNotBeAbstractClass = { __ItMustNotBeAnAbstractClass?: undefined };
export type ClassMustNotRepeatIndex<Index> = { __ItMustNotRepeatIndexes?: undefined };
export type EnsureProperties<T extends PropertiesClass> = IsAbstractClass<T> extends true
  ? ClassMustNotBeAbstractClass
  : MakeTupleKey<T['prototype']> extends MakeTupleKeySingle<T['prototype']>
    ? PropertiesForgeable<T> extends never
      ?  ClassMustExtendDogmaObject: T
    : ClassMustNotRepeatIndex<FindRepeatedIndex<T['prototype']>>;

export type EnhancerCallerRequired<C, Map extends {} = {}> = { [$dogma$]: { <C1 extends C>(property: PropertyDefinitionRequiredOutput<C1>): Map } } | (object & Exclude<Map, Function>);
export type EnhancerCallerNullableOptional<C, Map extends {} = {}> = { [$dogma$]: { <C1 extends C>(property: PropertyDefinitionNullableOptionalOutput<C1>): Map } } | (object & Exclude<Map, Function>);
export type EnhancerCallerOptional<C, Map extends {} = {}> = { [$dogma$]: { <C1 extends C>(property: PropertyDefinitionOptionalOutput<C1>): Map } } | (object & Exclude<Map, Function>);
export type EnhancerCallerNullable<C, Map extends {} = {}> = { [$dogma$]: { <C1 extends C>(property: PropertyDefinitionNullableOutput<C1>): Map } } | (object & Exclude<Map, Function>);
export type EnhancerCaller<C, Map extends {} = {}> = EnhancerCallerRequired<C, Map>
  | EnhancerCallerNullableOptional<C, Map>
  | EnhancerCallerOptional<C, Map>
  | EnhancerCallerNullable<C, Map>;

/**
 * Creates a dogma enhancer
 * @param enhancer
 */
export function createEnhancer<Enhancer extends EnhancerCaller<any, {}>>(enhancer: Enhancer): { [$dogma$]: Enhancer } {
  const obj = Object.create(null);
  Object.defineProperty(obj, $dogma$, {
    enumerable: false,
    writable: false,
    configurable: false,
    value: enhancer,
  });
  return obj;
}

export interface PropertyDefinitionRequiredOutput<T> {
  constructor: Function,
  key: string;
  type: () => T;
  index: number;
  initialized: false;
  defaultValue?: () => ResolveType<T>;
}

export interface PropertyDefinitionNullableOptionalOutput<T> {
  constructor: Function,
  key: string;
  type: () => DogmaNullableMember<T>;
  index: number;
  initialized: true;
}

export interface PropertyDefinitionOptionalOutput<T> {
  constructor: Function,
  key: string;
  type: () => T;
  index: number;
  initialized: true;
}

export interface PropertyDefinitionNullableOutput<T> {
  constructor: Function,
  key: string;
  type: () => DogmaNullableMember<T>;
  index: number;
  initialized: false;
}

export type PropertyDefinitionOutput<T> = PropertyDefinitionRequiredOutput<T>
  | PropertyDefinitionNullableOptionalOutput<T>
  | PropertyDefinitionOptionalOutput<T>
  | PropertyDefinitionNullableOutput<T>;

export type PropertyDefinitionOutputAny<T = any> = PropertyDefinitionOutput<T> & {
  [key: string]: any;
};

export function isPropertiesEmitting() {
  return emit;
}

export interface RequiredPropertyDefinition<N extends TupleIndexes = TupleIndexes, T = {}> {
  index: N;
  type: T;
  nullable: false;
  required: true;
  external: false;
}
export type $RequiredProperty<N extends TupleIndexes, T, Enhance = {}> = { [$dogma$]?: Enhance & RequiredPropertyDefinition<N, T>};
export type RequiredProperty<N extends TupleIndexes, T, Enhance = {}> = T & $RequiredProperty<N, T, Enhance>;

export interface NullablePropertyDefinition<N extends TupleIndexes = TupleIndexes, T = {}> {
  index: N;
  type: T;
  nullable: true;
  required: false;
  external: false;
}
export type $NullableProperty<N extends TupleIndexes, T, Enhance = {}> = { [$dogma$]?: Enhance & NullablePropertyDefinition<N, T> };
export type NullableProperty<N extends TupleIndexes, T, Enhance = {}> = T & $NullableProperty<N, T, Enhance>;
export type NullablePropertyMaybe<N extends TupleIndexes, T, Enhance = {}> = NullableProperty<N, T, Enhance> | null;

export interface OptionalPropertyDefinition<N extends TupleIndexes = TupleIndexes, T = {}> {
  index: N;
  type: T;
  nullable: false;
  required: false;
  external: false;
}

export type $OptionalProperty<N extends TupleIndexes, T, Enhance = {}> = { [$dogma$]?: Enhance & OptionalPropertyDefinition<N, T>};
export type OptionalProperty<N extends TupleIndexes, T, Enhance = {}> = T & $OptionalProperty<N, T, Enhance>;

export interface OptionalNullablePropertyDefinition<N extends TupleIndexes = TupleIndexes, T = {}> {
  index: N;
  type: T;
  nullable: true;
  required: false;
  external: false;
}
export type $OptionalNullableProperty<N extends TupleIndexes, T, Enhance = {}> = { [$dogma$]?: Enhance & OptionalNullablePropertyDefinition<N, T> };
export type OptionalNullableProperty<N extends TupleIndexes, T, Enhance = {}> = T & $OptionalNullableProperty<N, T, Enhance>;
export type OptionalNullablePropertyMaybe<N extends TupleIndexes, T, Enhance = {}> = OptionalNullableProperty<N, T, Enhance> | null;

export type Any = string | number | boolean | symbol | { [K in string | number | symbol]: any };

declare global {

  /**
   * Workaround for boolean not specific
   */
  export interface BooleanConstructor {
    __boolean__: true;
  }

}

type ResolveInnerType<T> = Any extends T
  ? Any
  : T extends { [key: number]: string }
    ? T[keyof T]
    : T extends (typeof String) | StringConstructor
      ? string
      : T extends (typeof Number) | NumberConstructor
        ? number
        : T extends BooleanConstructor
          ? boolean
          : T extends Function & { prototype: infer U }
            ? U
            : T extends { [x: number]: string }
              ? keyof T
              : T;

type ResolveNullableType<T> = T extends DogmaNullableMember<infer U>
  ? ResolveListOfType<U> | null
  : ResolveListOfType<T>;

type ResolveListOfType<T> = T extends Array<infer U>
  ? ResolveNullableType<U>[]
  : ResolveInnerType<T>;

export type ResolveType<T> = ResolveNullableType<OmitDefinition<T>>;

export type PropertyDefinitionValue<N extends TupleIndexes = TupleIndexes, T = {}> =
  RequiredPropertyDefinition<N, T>
  | NullablePropertyDefinition<N, T>
  | OptionalPropertyDefinition<N, T>
  | OptionalNullablePropertyDefinition<N, T>;

export type PropertyDefinition<U extends PropertyDefinitionValue = PropertyDefinitionValue> = {  [$dogma$]?: U };

export type OmitDefinition<T> = Exclude<T, null | undefined> extends { [$dogma$]?: PropertyDefinitionValue<any, infer U> }
  ? U
  : T;

export type NumerizeDefinition<T> = T extends RequiredProperty<any, infer U, any>
    ? RequiredProperty<TupleIndexes, U>
    : T extends NullableProperty<any, infer U, any>
      ? NullablePropertyDefinition<any, U>
      : T extends OptionalProperty<any, infer U, any>
        ? OptionalPropertyDefinition<any, U>
        : T extends OptionalNullableProperty<any, infer U, any>
          ? OptionalNullableProperty<any, U>
          : never;

export type DefaultThunk<T> = T | ((def?: never) => T);

export interface PropertyCaller<N extends TupleIndexes> {
  /*
  (type: StringConstructor, def: DefaultThunk<string>): OptionalProperty<N, string>;
  (type: NumberConstructor, def: DefaultThunk<number>):  OptionalProperty<N, number>;
  (type: BooleanConstructor, def: DefaultThunk<boolean>):  OptionalProperty<N, boolean>;
  <U>(type: U, def: DefaultThunk<ResolveType<U>>): OptionalProperty<N, ResolveType<U>>;
  <U>(type: NullableMember<U>, def: DefaultThunk<ResolveType<U> | null>): NullablePropertyMaybe<N, ResolveType<U>>;
  <Enhance = {}>(type: StringConstructor, def: DefaultThunk<string>, ...enhacers: EnhancerCallerOptional<StringConstructor, Enhance>[]): OptionalProperty<N, string, Enhance>;
  <Enhance = {}>(type: NumberConstructor, def: DefaultThunk<number>, ...enhacers: EnhancerCallerOptional<NumberConstructor, Enhance>[]): OptionalProperty<N, number, Enhance>;
  <Enhance = {}>(type: BooleanConstructor, def: DefaultThunk<boolean>, ...enhacers: EnhancerCallerOptional<BooleanConstructor, Enhance>[]): OptionalProperty<N, boolean, Enhance>;
  <U, Enhance = {}>(type: U, def: DefaultThunk<ResolveType<U>>, ...enhacers: EnhancerCallerOptional<U, Enhance>[]): OptionalProperty<N, ResolveType<U>, Enhance>;
  <U, Enhance = {}>(type: NullableMember<U>, def: DefaultThunk<ResolveType<U> | null>, ...enhacers: EnhancerCallerNullableOptional<U, Enhance>[]): OptionalNullablePropertyMaybe<N, ResolveType<U>, Enhance>;
  <U, Enhance = {}>(type: NullableMember<U>, ...enhacers: EnhancerCallerNullable<U, Enhance>[]): NullablePropertyMaybe<N, ResolveType<U>, Enhance>;
  <U, Enhance = {}>(type: U, ...enhacers: EnhancerCallerRequired<U, Enhance>[]): RequiredProperty<N, ResolveType<U>, Enhance>;
  <U>(type: NullableMember<U>): NullablePropertyMaybe<N, ResolveType<U>>;
  <U>(type: U): RequiredProperty<N, ResolveType<U>>;
  */
  required: {
    <U, Enhance = {}>(type: U, ...enhacers: EnhancerCallerOptional<U, Enhance>[]): RequiredProperty<N, ResolveType<U>, Enhance>;
  };
  optional: {
    <U, Enhance = {}>(type: U, def: DefaultThunk<ResolveType<U>>, ...enhacers: EnhancerCallerOptional<U, Enhance>[]): OptionalProperty<N, ResolveType<U>, Enhance>;
    <U, Enhance = {}>(type: U, ...enhacers: EnhancerCallerOptional<U, Enhance>[]): OptionalNullablePropertyMaybe<N, ResolveType<U>, Enhance>;
  };
  repeated: {
    <U, Enhance = {}>(type: U, def: DefaultThunk<ResolveType<U>>, ...enhacers: EnhancerCallerOptional<U, Enhance>[]): OptionalProperty<N, ResolveType<Array<U>>, Enhance>;
    <U, Enhance = {}>(type: U, ...enhacers: EnhancerCallerOptional<U, Enhance>[]): OptionalNullablePropertyMaybe<N, ResolveType<Array<U>>, Enhance>;
  };
}


export type PropertyOutOfBoundConstraint = {
  start: 0;
  end: 99;
};

export interface PropertySubscriberProperty {
  type: Function;
  defaultValue?: Function;
  enhancers?: { enhance: Function }[];
}

export interface PropertySubscriberHandler {
  (property: PropertySubscriberProperty): void;
}

export type PropertyShape = { [N in TupleIndexes]: PropertyCaller<N> } & {
  [key: number]: PropertyOutOfBoundConstraint;
};


const DogmaProperty = {} as any as PropertyShape;

const map = new WeakMap<Function, any>();
let emit = false;
let currentInstance: any;
export class PropertyDefinitionObject {}

function setEmit(state: boolean) {
  emit = state;
}

export function getAllProperties(obj: any) {
  const allProps: string[] = [];
  let curr: any = obj;
  do {
    const props = Object.getOwnPropertyNames(curr);
    props.forEach(function(prop){
      if (allProps.indexOf(prop) === -1)
        allProps.push(prop)
    })
  } while(curr = Object.getPrototypeOf(curr));
  return allProps;
}

export interface ArrayLikePropertyDefinitions extends ArrayLike<PropertyDefinitionOutputAny> {
  keyMap: { [key: string]: number };
}

export function getProperties<T extends Function & { prototype: AbstractProperties<T['prototype']> }>(target: EnsureProperties<T>): ArrayLikePropertyDefinitions | null {
  return map.get(target as any);
}

const _Property = DogmaProperty;
const PropertyMember = function Property(this: { index: number }, type: any, ...args: any[]) {
  if (emit) {
    let defaultValue: any;
    let enhancers: any[];
    if (args.length > 0 && !isEnhancer(args[0])) {
      ([defaultValue, ...enhancers] = args);
    } else {
      enhancers = args;
    }
    const def = new PropertyDefinitionObject() as any;
    def.index = this.index;
    def.type = type;
    def.initialized = defaultValue != null;
    def.enhancers = enhancers;
    return def;
  } else {
    if (!currentInstance) {
      throw new TypeError(`Dogma[${this.index}] must be executed inside a class decorated by @Dogma`);
    }
    const properties = getProperties(currentInstance.constructor);
    if (!properties) {
      throw new TypeError();
    }
    let defaultValue = undefined;
    const { key } = properties[this.index];
    if (currentInstance[key] !== undefined) {
      return typeof currentInstance[key] === 'function'
        ? currentInstance[key]()
        : currentInstance[key];
    } else if (args.length > 0 && !isEnhancer(args[0])) {
      defaultValue = typeof args[0] === 'function' ? args[0]() : args[0];
    }
    return defaultValue;
  }
};

export function isEnhancer(value: any): value is EnhancerCaller<any, {}> {
  return typeof value === 'object' && value != null && 'enhance' in value;
}

for (let i = 0; i < 100; i++) {
  const Property = PropertyMember.bind({ index: i });
  (_Property as any)[i] = {
    required: (type: any, ...args: any[]) => Property(type, ...args),
    optional: (type: any, ...args: any[]) => Property(!args[0] || isEnhancer(args[0]) ? DogmaNullable(type) : type, ...args),
    repeated: (type: any, ...args: any[]) => Property(!args[0] || isEnhancer(args[0]) ? DogmaNullable(Array(type)) : Array(type), ...args),
  };
}

export type IsPropertyOptional<T> = T extends { [$dogma$]?: infer U }
  ? (Required<U> extends { required: false } ? true : false)
  : false;
export type IsPropertyNullable<T> = T extends { [$dogma$]?: infer U }
  ? (Required<U> extends { nullable: true } ? true : false)
  : false;
export type OptionalInlinePropertyKeys<T> = Exclude<{ [K in PropertyKeys<T>]: undefined extends T[K] ? K : null }[PropertyKeys<T>], null>;
export type OptionalPropertyKeys<T> = Exclude<{ [K in PropertyKeys<T>]: IsPropertyOptional<T[K]> extends true ? K : null }[PropertyKeys<T>], null>;
export type NullablePropertyKeys<T> = Exclude<{ [K in PropertyKeys<T>]: IsPropertyNullable<Exclude<T[K], null | undefined>> extends true ? K : null }[PropertyKeys<T>], null>;

export type ThunkValue<T, Value> = ((self: T) => Value) | Value;
export type PropertyObject<T> = { [K in PropertyKeys<T>]: OmitDefinition<T[K]> };
export type Forge<T> = {
  [K in OptionalInlinePropertyKeys<T> | OptionalPropertyKeys<T>]?: ThunkValue<T, K extends NullablePropertyKeys<T> ? OmitDefinition<T[K]> | null : OmitDefinition<T[K]>>
} & {
  [K in Exclude<NullablePropertyKeys<T>, OptionalPropertyKeys<T> | OptionalInlinePropertyKeys<T>>]?: ThunkValue<T, OmitDefinition<T[K]> | null>
} & {
  [K in Exclude<keyof PropertyObject<T>, OptionalPropertyKeys<T> | OptionalInlinePropertyKeys<T> | NullablePropertyKeys<T>>]: ThunkValue<T, OmitDefinition<T[K]>>
};

export type TupleItemValue<T> = T extends { index: TupleIndexes, type: any }
  ? {
    [K2 in T['index']]: T extends { nullable?: true }
      ? (T['type'] | null | undefined)
      : T extends { optional?: true }
        ? T['type'] | undefined
        : T['type']
  }
  : {};

export type TupleItemValueStrict<T> = T extends { index: TupleIndexes, type: any }
  ? { [K2 in T['index']]: T extends { nullable?: true } ? (T['type'] | null) : T['type'] }
  : {};
export type MakeTupleValueStrict<T> = Merge<{ [K in keyof PropertyDefinitions<T>]: TupleItemValueStrict<PropertyDefinitions<T>[K]> }>;
export type MakeTupleValue<T> = Merge<{ [K in keyof PropertyDefinitions<T>]: TupleItemValue<PropertyDefinitions<T>[K]> }>;
export type TupleValues<T> = NormalizeTuple<MakeTupleValue<T>>;
export type TupleKeys<T> = NormalizeTuple<MakeTupleKey<T>>;

export type StrictTupleValues<T> = NormalizeTuple<MakeTupleValueStrict<T>>;

const jsonSerializer = new JSONSerializer();

let forging = false;

export class DogmaObject {

  static [$dogma$]: {
    type: number;
    reserved?: DogmaReserved;
  };

  static serializer: Serializer = jsonSerializer;

  static getDogmaType(): number | string {
    return this[$dogma$].type;
  }

  static isDogmaType(type: number | string) {
    return this[$dogma$].type === type;
  }

  static getProperties() {
    return getProperties(this) as ArrayLikePropertyDefinitions;
  }

  static getPropertyNames<T extends DogmaObject>(this: DogmaObjectStatic<T>): TupleKeys<T> {
    return Object.keys(this.getProperties().keyMap) as any;
  }

  static fromValues<T extends DogmaObject>(this: DogmaObjectStatic<T>, values: TupleValues<T>) {
    return this.serializer.fromValues(this, values);
  }

  static encodeUnsigned<T extends DogmaObject>(this: DogmaObjectStatic<T>, value: T): Buffer {
    return this.serializer.encodeType(this, value);
  }

  static decodeUnsigned<T extends DogmaObject>(this: DogmaObjectStatic<T>, bytes: Buffer): T {
    return this.serializer.decodeType(this, bytes);
  }

  static encode<T extends DogmaObject>(this: DogmaObjectStatic<T>, value: T): Buffer {
    return this.serializer.sign(this[$dogma$].type, this.encodeUnsigned(value));
  }

  static decode<T extends DogmaObject>(this: DogmaObjectStatic<T>, bytes: Buffer | string, encoding?: BufferEncoding): T {
    const { type, payload } = typeof bytes === 'string'
      ? this.serializer.unsign(bytes, encoding)
      : this.serializer.unsign(bytes);
    if (type !== this[$dogma$].type) {
      throw new TypeError(`Invalid type`);
    }
    return this.decodeUnsigned(payload);
  }

  static parse<T extends DogmaObject>(this: DogmaObjectStatic<T>, str: string, encoding: BufferEncoding = 'base64') {
    return this.decode(Buffer.from(str, encoding));
  }

  static fromJSON<T extends DogmaObject>(this: DogmaObjectStatic<T>, json: any): T {
    return this.serializer.fromJSON(this, json) as any;
  }

  static fromJSONString<T extends DogmaObject>(this: DogmaObjectStatic<T>, jsonString: string): T {
    return this.fromJSON(JSON.parse(jsonString));
  }

  static forge<T extends DogmaObject>(this: DogmaObjectStatic<T>, forge: Forge<T>): T {
    try {
      forging = true;
      const inst = new (this as any)(forge as any);
      forging = false;
      return inst;
    } catch (error) {
      forging = false;
      throw error;
    }
  }

  static stringify<T extends DogmaObject>(this: DogmaObjectStatic<T>, forge: Forge<T>, encoding?: BufferEncoding) {
    return this.forge(forge).stringify(encoding);
  }

  static clone<T extends DogmaObject>(this: DogmaObjectStatic<T>, type: T, patch?: Partial<Forge<T>>): T {
    const plain = type.toPlainObject() as any;
    return this.forge(patch ? Object.assign(plain, patch) : plain);
  }

  constructor() {
    if (isPropertiesEmitting()) {
      return this;
    }
    if (!forging) {
      throw new TypeError(`A Dogma.Object must be instantiated by forge method`);
    }
    const properties = getProperties(this.constructor as any);
    if (!properties) {
      throw new TypeError(`You must wrap a extended Dogma.Object with @Dogma decorator`);
    }
    const forge = arguments[0];
    currentInstance = this;
    for (const key in (typeof forge === 'function' ? forge() : forge)) {
      if (forge !== undefined && forge.hasOwnProperty(key) && properties.keyMap.hasOwnProperty(key)) {
        this[key] = forge[key];
      }
    }
  }

  encodeUnsigned() {
    const type = this.constructor as DogmaObjectStatic;
    return type.encodeUnsigned(this);
  }

  encode() {
    const type = this.constructor as DogmaObjectStatic;
    return type.encode(this);
  }

  stringify(encoding: BufferEncoding = 'base64') {
    return this.encode().toString(encoding);
  }

  toValues(): StrictTupleValues<this> {
    const type = this.constructor as DogmaObjectStatic<this>;
    return type.serializer.toValues(type, this);
  }

  toPlainObject(): PlainObject<this> {
    const type = this.constructor as DogmaObjectStatic<this>;
    return type.serializer.toPlainObject(type, this);
  }

}

/**
 * Description decorator for properties
 * @constructor
 */
export function comment(template: TemplateStringsArray, ...substitutions: any[]): {
  (constructor: { new(): DogmaObject }): void;
  <Key extends string, T extends DogmaObject & { [K in Key]?: (...args: any[]) => any }>(target: T, propertyKey: Key): void;
  <Key extends string, T extends DogmaObject & { [K in Key]?: PropertyLikely<T[K]> }>(target: T, propertyKey: Key): void;
};
export function comment(template: TemplateStringsArray, ...substitutions: any[]) {
  return (...args: any) => {
    if (typeof args[0] === 'function') {
      Reflect.defineMetadata('description', String.raw(template, ...substitutions), args[0]);
    } else {
      Reflect.defineMetadata('description', String.raw(template, ...substitutions), args[0], args[1]);
    }
  };
}

export function getComment<T extends DogmaObject>(constructor: DogmaObjectStatic<T>): string | null;
export function getComment<T extends DogmaObject, K extends PropertyKeys<T>>(constructor: DogmaObjectStatic<T>, key: K): string | null;
export function getComment(target: any, ...args: any[]) {
  return (Reflect.getMetadata as any)('description', args.length > 0 ? target.prototype : target, ...args);
}
export function getEnum(enumerator: string): { name: string, comment: string | undefined, enumerator: { [key: number]: string } };
export function getEnum<T extends { [key: number]: string }>(enumerator: T): { name: string, comment: string | undefined, enumerator: T };
export function getEnum(enumerator: { [key: number]: string } | string) {
  let options: any;
  if (typeof enumerator === 'string') {
    if (!enumerators[enumerator]) {
      throw new TypeError(`No enumerator with name "${enumerator}" was found`);
    }
    options = enumerators[enumerator][$dogma$];
  } else {
    options = enumerator[$dogma$];
  }

  if (!options) {
    throw new TypeError(`The specified enumerator was not registered`);
  }

  return {
    ...options,
    enumerator: typeof enumerator === 'string'
      ? enumerators[enumerator]
      : enumerator,
  };
}

export type DogmaReserved = (TupleIndexes | [TupleIndexes, TupleIndexes])[];

export interface DogmaOptions {
  name?: string;
  type?: number | string;
  comment?: string;
}

export interface DogmaEnumOptions extends DogmaOptions {
  name: string;
}

export interface DogmaClassOptions<T extends { new(...args: any[]): any } = never> extends DogmaOptions {
  reserved?: DogmaReserved;
  implements?: T[]
}

export type UnionToIntersection<U> = (U extends any
  ? (k: U) => void
  : never) extends (k: infer I) => void
  ? I
  : never;


export type ImplementsType<U> = U extends { new (...args: any[]): infer T  } ? T : never;

type EnsurePropertiesImplements<T, U> = T extends { new(...args: any[]): PlainObject<UnionToIntersection<ImplementsType<U>>> }
  ? EnsureProperties<T>
  : { new(...args: any[]): Implements<UnionToIntersection<ImplementsType<U>>> };

export interface DogmaStatic {
  <U extends { new(...args: any[]): any }>(options?: DogmaClassOptions<U>): {
    <T extends PropertiesClass>(target: EnsurePropertiesImplements<T, U>): T & { new(forge: Forge<T>): T };
  };
  (enumerator: { [key: number]: string }, options: DogmaEnumOptions): void;
}

export default Object.assign(
  (function Dogma(...args: any[]) {
    if (args.length > 1) {
      if (isEnum(args[0])) {
        const options = args[1] as DogmaEnumOptions;
        enumerators[options.name] = args[0];
        Object.defineProperty(args[0], $dogma$, {
          enumerable: false,
          writable: false,
          configurable: false,
          value: { ...options },
        });
        return;
      }
      throw new TypeError();
    }
    return <T extends PropertiesClass>(target: EnsureProperties<T>): T & { new(forge: Forge<T>): T } => {
      const options = (args[0] || {}) as DogmaClassOptions;
      const { reserved, type } = options;
      if (options.comment) {
        (comment `${options.comment}`)(target as any);
      }
      Object.defineProperty(DogmaObject, $dogma$, {
        enumerable: false,
        writable: false,
        configurable: true,
        value: {
          type: type || (target as any).name,
          reserved,
        },
      });

      if (!((target as any).prototype instanceof DogmaObject)) {
        throw new TypeError(`Target must extend Dogma.Object`);
      }

      let properties: ArrayLikePropertyDefinitions;
      if (map.has(target as any)) {
        throw new TypeError();
      }
      try {
        setEmit(true);
        const obj = new (target as any)();
        setEmit(false);
        properties = {length: 0, keyMap: {}};
        let maxLength = 0;
        const propKeys = getAllProperties(obj);
        for (const key of propKeys) {
          const prop = obj[key];
          if (prop instanceof PropertyDefinitionObject) {
            (prop as any).key = key;
            (prop as any).constructor = target;
            (properties as any)[(prop as any).index] = prop;
            (properties as any).length = Math.max(properties.length, (prop as any).index + 1);
            if ((prop as any).enhancers) {
              const {enhancers} = (prop as any);
              delete (prop as any).enhancers;
              for (const enhancer of enhancers) {
                if (typeof enhancer.enhance === 'function') {
                  enhancer.enhance(prop);
                } else {
                  Object.assign(prop, enhancer);
                }
              }
            }
          }
        }

        for (let i = 0; i < properties.length; i++) {
          const property = properties[i];
          if (!property) {
            continue;
          }
          const {type, index, initialized, key, ...extra} = property;
          if (!key) {
            throw new Error(`Could not determinate property ${index}`);
          }
          let defaultValue: any;
          try {
            // @ts-ignore
            require('reflect-metadata');
            defaultValue = Reflect.getMetadata('DefaultValue', (target as any).prototype, key);
          } catch (error) {}
          (properties as any)[index] = {
            index,
            type,
            key,
            initialized,
            defaultValue,
            ...extra,
          };
          properties.keyMap[key] = property.index;
        }

        for (let i = 0; i < maxLength; i++) {
          if (properties[i] == null) {
            throw new Error(`Missing Dogma[${i}]`);
          }
        }

        map.set(target as any, properties);
      } catch (error) {
        setEmit(false);
        throw error;
      }
      return target as any;
    };
  } as DogmaStatic),
  DogmaProperty,
  {
    getProperties,
    comment,
    getComment,
    getEnum,
    Nullable: DogmaNullable,
    Object: DogmaObject,
  },
);

export type DogmaObjectStatic<T extends DogmaObject = DogmaObject> = { [K in Exclude<keyof typeof DogmaObject, 'prototype'>]: (typeof DogmaObject)[K] }
  & { new(): T };

export type PlainObject<T> = {
  [K in OptionalInlinePropertyKeys<T>]-?: K extends NullablePropertyKeys<T> ? OmitDefinition<T[K]> | null : OmitDefinition<T[K]>
} & {
  [K in OptionalPropertyKeys<T>]: OmitDefinition<T[K]>
} & {
  [K in Exclude<NullablePropertyKeys<T>, OptionalPropertyKeys<T> | OptionalInlinePropertyKeys<T>>]: OmitDefinition<T[K]> | null
} & {
  [K in Exclude<keyof PropertyObject<T>, OptionalPropertyKeys<T> | OptionalInlinePropertyKeys<T> | NullablePropertyKeys<T>>]: OmitDefinition<T[K]>
};

export type Implements<T> = {
  [K in PropertyKeys<T>]-?: NumerizeDefinition<T>
};