import 'buffer';
import { isEnum } from './utils';
import { crc16 } from './crc16';
import { isDogma } from './isDogma';
import {DogmaObjectStatic, ResolveType, TupleValues, StrictTupleValues, PlainObject, DogmaObject} from './Dogma';
import { DogmaNullable } from './DogmaNullable';

export abstract class Serializer {
  abstract encodeType(type: any, value: any): Buffer;
  abstract decodeType(type: any, bytes: Buffer): any;

  sign(type: string | number, payload: Buffer): Buffer {
    let typePrefix: Buffer;
    if (typeof type === 'number') {
      if (type < 0 || type % 1 !== 0) {
        throw new TypeError(`The identifier type as number must be an unsigned integer`);
      }
      if (type <= 63) {
        typePrefix = Buffer.alloc(1);
        typePrefix[0] = 0x80 | type;
      } else if (type <= 16383) {
        typePrefix = Buffer.alloc(2);
        typePrefix.writeUInt16BE(type, 0);
        typePrefix[0] = 0xc0 | typePrefix[0];
      } else {
        throw new TypeError(`The identifier type as number must not be higher than ${16383}`);
      }
    } else {
      const typeValue = Buffer.from(type);
      let typeLen: Buffer;
      if (typeValue.byteLength <= 63) {
        typeLen = Buffer.alloc(1);
        typeLen[0] = typeValue.byteLength;
      } else if (typeValue.byteLength <= 16383) {
        typeLen = Buffer.alloc(2);
        typeLen.writeUInt16BE(typeValue.byteLength, 0);
        typeLen[0] = 0x40 | typeLen[0];
      } else {
        throw new TypeError(`The identifier type as string must have a byte length of ${16383} maximum`);
      }
      typePrefix = Buffer.concat([typeLen, typeValue]);
    }
    const checksum = Buffer.alloc(2);
    checksum.writeUInt16BE(crc16(payload), 0);
    return Buffer.concat([typePrefix, payload, checksum]);
  }

  unsign(bytes: Buffer | string, encoding?: BufferEncoding): { type: number | string, checksum: number, payload: Buffer } {
    let type: number | string;
    const buf = bytes instanceof Buffer
      ? bytes
      : typeof bytes === 'string'
        ? Buffer.from(bytes, encoding || 'base64')
        : new Buffer(bytes);
    const isNumber = buf[0] >> 7;
    const isUint14 = buf[0] >> 6 & 1;
    buf[0] = buf[0] & 0x3f;
    let value: number;
    let skipBytes = 0;
    if (isUint14) {
      value = buf.readUInt16BE(0);
      skipBytes += 2;
    } else {
      value = buf.readUInt8(0);
      skipBytes += 1;
    }
    if (isNumber) {
      type = value;
    } else {
      type = buf.slice(isUint14 ? 2 : 1, value + 1).toString();
      skipBytes += value;
    }
    const checksum = buf.readUInt16BE(buf.length - 2);
    const payload = buf.slice(skipBytes, buf.length - 2);
    if (checksum != crc16(payload)) {
      throw new TypeError(`Checksum doesn't match`);
    }
    return { type, checksum, payload };
  }

  fromValues<T extends DogmaObject>(type: DogmaObjectStatic<T>, values: TupleValues<T>) {
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

  toValues<T extends DogmaObject>(type: DogmaObjectStatic<T>, value: T): StrictTupleValues<T> {
    const properties = type.getProperties();
    return Array.from({ length: properties.length }, (_, i) => properties[i] && value[properties[i].key]) as any;
  }

  toPlainObject<T extends DogmaObject>(type: DogmaObjectStatic<T>, value: T): PlainObject<T> {
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