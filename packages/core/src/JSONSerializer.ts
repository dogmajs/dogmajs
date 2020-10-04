import { Serializer } from './Serializer';
import { isDogma } from './isDogma';
import { crc16 } from './crc16';

export class JSONSerializer extends Serializer {

  encodeType(type: any, value: any) {
    if (isDogma(type)) {
      const json = JSON.stringify(this.toJSONValues(type, value));
      return Buffer.from(json.substr(1, json.length - 2));
    }
    return Buffer.from(JSON.stringify(value));
  }

  decodeType(type: any, bytes: Buffer) {
    const json = JSON.parse(isDogma(type) ? `[${bytes}]` : bytes.toString());
    return this.fromJSON(type, json);
  }

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

  verify(bytes: Buffer | string, encoding?: BufferEncoding): { type: number | string, checksum: number, payload: Buffer } {
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

}