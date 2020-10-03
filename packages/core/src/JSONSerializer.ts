import { Serializer } from './Serializer';
import { isDogma } from './isDogma';

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

}