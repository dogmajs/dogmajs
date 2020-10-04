# Dogma  
  
Dogma is an **experimental** project that should help you create better
TypeScript NodeJS Rest APIs. It enables you to create serialisable models that are JSON type
safe and fully type checked.

The Dogma is a also a solution for "writing type once", this is particularly useful when [Metadata Reflect API](https://www.npmjs.com/package/reflect-metadata)
is not enough, as Reflect is only coerce when types are solely based on `typeof` and `instanceof`.
In all the other cases when you wrap your type into an array or make it nullable with union types, Reflect stops preserving
types.
 
### Example usage  
  
```typescript  
import Dogma from 'dogmajs';

enum UserStatus {
    ACTIVE = 0;
    INACTIVE = 1;
}

Dogma(UserStatus, {
  name: 'UserStatus',
  comment: `The User status`,
});

@Dogma({
  comment: `A resource owner can be an User or an Organization`,
})
export abstract class ResourceOwner extends Dogma.Object {

  @Dogma.comment `The resource owner id`
  id = Dogma[0].required(String);
  
  @Dogma.comment `The resource owner display name`
  displayName = Dogma[1].required(String); 
 
}

@Dogma({
  comment: `The global user`,
  implements: [ResourceOwner],
})  
export class User extends Dogma.Object {  
    
  @Dogma.comment `The user's id`
  readonly id = Dogma[0].required(String);  
  
  @Dogma.comment `The user's email`
  readonly email = Dogma[3].optional(String);  
    
  @Dogma.comment `The user's given name or first name`
  readonly givenName = Dogma[1].required(String);  
    
  @Dogma.comment `The user's family name`
  readonly familyName = Dogma[2].required(String);  
  
  @Dogma.comment `The user's display name`
  readonly displayName = Dogma[4].optional(String, () => `${this.givenName} ${this.familyName}`);  
  
  @Dogma.comment `The user's date of registration`
  readonly registeredAt = Dogma[5].optional(Date, () => new Date());  
    
  @Dogma.comment `The user's followers`
  readonly followers? = Dogma[6].repeated(User);
  
  @Dogma.comment `The user's status`
  readonly status = Dogma[7].optional(UserStatus, UserStatus.ACTIVE);

}  

const user = User.forge({  
  id: '1',
  givenName: 'John',  
  familyName: 'Doe',  
});  
  
const parsedUser = User.parse(JSON.stringify(user));

if (
  parsedUser instanceof User
    && parsedUser.registeredAt instanceof Date // witch means it unserializes Date objects
) {  
  // this will be true  
}
```  
  
##### Dogma gives you more abstraction to model types

```typescript
// Static members
export interface UserStatic {
  /**
   * The dogma factory serializer
   */
  serializer: JSONSerializer;

  /**
   * Get factory property definitions
   */
  getProperties(): ArrayLikePropertyDefinitions;

  /**
   * Get factory property names
   */
  getPropertyNames(): TupleKeys<User>;

  /**
   * Transform json serialized object into properties factory
   * @param json
   */
  fromJSON(json: { [key: string]: any } | any[]): User;

  /**
   * Transform json serialized string into properties factory
   * @param jsonString
   */
  fromJSONString(jsonString: string): User;

  /**
   * Transform property tuple values into properties factory
   * @param values
   */
  fromValues(values: TupleValues<User>): User;

  /**
   * Transform property tuple values into properties factory with strict values
   * @param values
   */
  fromStrictValues(values: StrictTupleValues<User>): User;

  /**
   * Encodes properties factory to base64 string
   * @param forge
   * @param encoding
   */
  stringify(forge: Forge<User>, encoding?: 'hex' | 'base64'): string;

  /**
   * Parse a base64 string into properties factory
   * @param str
   * @param encoding
   */
  parse(str: string, encoding?: 'hex' | 'base64'): User;

  /**
   * Encodes properties factory into array of bytes
   * @param value
   * @param encoding
   */
  encode(value: User): Uint8Array;

  /**
   * Decodes array of bytes into properties factory
   * @param bytes
   */
  decode(bytes: Uint8Array): User;
}

// Prototype members
interface User {
  /**
   * Transform properties factory into tuple of property values
   */
  toValues(): TupleValues<UserProperties>;

  /**
   * Return all property keys
   */
  toKeys(): TupleKeys<UserProperties>;

  /**
   * Transform properties factory into plain object
   */
  toPlainObject(): PlainObject<UserProperties>;

  /**
   * Transform properties factory into json ready object
   */
  toJSON(): { [key: string]: any };

  /**
   * Transform properties factory into json ready tuple of values
   */
  toJSONValues(): any[];

  /**
   * Stringify
   * @param encoding
   */
  stringify(encoding?: 'hex' | 'base64'): string;

  /**
   * Transform serializeable factory into bytes
   */
  encode(): Uint8Array;
}
```