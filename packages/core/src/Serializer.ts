import 'buffer';
import { isEnum } from './utils';
import { isDogma } from './isDogma';
import {DogmaObjectForgeable, ResolveType, TupleValues, StrictTupleValues, PlainObject, DogmaObject} from './Dogma';
import { DogmaNullable } from './DogmaNullable';

export abstract class Serializer {
  abstract encodeType(type: any, value: any): Buffer;
  abstract decodeType(type: any, bytes: Buffer): any;

  fromValues<T extends DogmaObject>(type: DogmaObjectForgeable<T>, values: TupleValues<T>) {
    const forge: any = {};
    const properties = type.getProperties();
    for (let i = 0; i < properties.length; i++) {
      if (properties[i]) {
        const prop = properties[i];
        if (values[i] !== undefined) {
          forge[prop.key] = values[i];
        }
      }
    }
    return type.forge(forge);
  }

  toValues<T extends DogmaObject>(type: DogmaObjectForgeable<T>, value: T): StrictTupleValues<T> {
    const properties = type.getProperties();
    return Array.from({ length: properties.length }, (_, i) => properties[i] && value[properties[i].key]) as any;
  }

  toPlainObject<T extends DogmaObject>(type: DogmaObjectForgeable<T>, value: T): PlainObject<T> {
    const properties = type.getProperties();
    const obj: any = {};
    for (let i = 0; i < properties.length; i++) {
      if (properties[i]) {
        const { key } = properties[i];
        obj[key] = value[key];
      }
    }
    return obj;
  }

  toJSON<T>(type: T, value: ResolveType<T>): any {
    if (isEnum(type)) {
      return value;
    }
    if (type instanceof Array) {
      return (value as any[]).map(value => this.toJSON(type[0], value));
    }
    if (type instanceof DogmaNullable) {
      if (value == null) {
        return null;
      }
      return this.toJSON(type.type, value);
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }
    return 'toJSON' in value
        ? (value as any).toJSON()
        : 'toString' in value
          ? (value as any).toString()
          : 'toNumber' in value
            ? (value as any).toNumber()
            : 'toBoolean' in value
              ? (value as any).toBoolean()
              : value;
  }

  toJSONValues<T>(type: T, value: ResolveType<T>): any[] {
    if (type instanceof Array) {
      return (value as any[]).map(value => this.toJSONValues(type[0], value)) as any;
    }
    if (type instanceof DogmaNullable) {
      if (value == null) {
        return null as any;
      }
      return this.toJSONValues(type.type, value) as any;
    }
    if (isDogma(type)) {
      const properties = type.getProperties();
      return Array.from({length: properties.length}, (_, i) => properties[i] && this.toJSONValues(properties[i].type, value[properties[i].key]) || null) as any;
    }
    return this.toJSON(type, value);
  }

  fromJSON<T>(type: T, value: any): ResolveType<T> {
    if (type instanceof Array) {
      return (value as any[]).map(value => this.fromJSON(type[0], value)) as any;
    }
    if (type instanceof DogmaNullable) {
      if (value == null) {
        return null as any;
      }
      return this.fromJSON(type.type, value) as any;
    }
    if (isDogma(type)) {
      const properties = type.getProperties();
      if (Array.isArray(value)) {
        return (type as any).fromValues(
          Array.from({ length: properties.length }, (_, i) => properties[i] && this.fromJSON(properties[i].type, value[i]) || null) as any,
        );
      } else {
        const obj: any = {};
        for (let i = 0; i < properties.length; i++) {
          if (properties[i]) {
            const prop = properties[i];
            obj[prop.key] = this.fromJSON(prop.type, value[prop.key]);
          }
        }
        return type.forge(obj as any) as any;
      }
    }
    return 'fromJSON' in type
      ? (type as any).fromJSON(value) as any
      : typeof value === 'string' && 'fromString' in type
        ? (type as any).fromString(value) as any
        : typeof value === 'number' && 'fromNumber' in type
          ? (type as any).fromNumber(value)
          : typeof value === 'boolean' && 'fromBoolean' in type
            ? (type as any).fromBoolean(value)
            : typeof type === 'function'
                && (type as any) !== String
                && (type as any) !== Number
                && (type as any) !== Boolean
              ? new (type as any)(value)
              : isEnum(type)
                ? value
                : value;
  }
}