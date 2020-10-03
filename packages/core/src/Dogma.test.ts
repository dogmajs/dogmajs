/// <reference types="jest" />
import 'reflect-metadata';
import Dogma from './Dogma';

enum UserStatus {
  ACTIVE = 1,
  INACTIVE = 2
}
console.time('enum');
Dogma(UserStatus, {
  name: 'UserStatus',
  comment: 'The user statuses',
});
console.timeEnd('enum');

console.time('ResourceOwner');
@Dogma()
class ResourceOwner extends Dogma.Object {
  id = Dogma[0].required(String);
  displayName = Dogma[1].required(String);
}

console.timeEnd('ResourceOwner');
@Dogma()
class UserProfile extends Dogma.Object {
  givenName = Dogma[0].required(String);
  familyName = Dogma[1].required(String);
}

console.time('User');
@Dogma({
  comment: 'The global user',
  implements: [UserProfile, ResourceOwner],
})
class User extends Dogma.Object {
  @Dogma.comment `The user id`
  id = Dogma[0].required(String);
  email = Dogma[4].required(String);
  givenName = Dogma[1].required(String);
  familyName = Dogma[2].required(String);
  displayName = Dogma[3].optional(String, () => `${this.givenName} ${this.familyName}`);
  registeredAt = Dogma[5].optional(Date, () => new Date());
  status = Dogma[6].optional(UserStatus, UserStatus.ACTIVE);
  followers? = Dogma[7].repeated(User, []);
  phoneNumber = Dogma[8].optional(String);
  removed? = Dogma[9].optional(Boolean, false);
  parent = Dogma[10].optional(User);
}
console.timeEnd('User');

describe('Dogma.getEnum', () => {
  test('registered enums must be called out by thyself', () => {
    const { name, comment } = Dogma.getEnum(UserStatus);
    expect(name).toBe('UserStatus');
    expect(comment).toBe('The user statuses');
  });

  test('registered enums must be called out by their name', () => {
    const { enumerator } = Dogma.getEnum('UserStatus');
    expect(enumerator).toBe(UserStatus);
  });
});

describe('Dogma#getComment', () => {
  test('type must have description', () => {
    expect(Dogma.getComment(User)).toBe('The global user');
  });

  test('property must have description', () => {
    expect(Dogma.getComment(User, 'id')).toBe('The user id');
  });
});

describe('DogmaObject#getPropertyNames', () => {
  test('order must match indexes', () => {
    expect(
      User.getPropertyNames(),
    ).toStrictEqual([
      'id',
      'givenName',
      'familyName',
      'displayName',
      'email',
      'registeredAt',
      'status',
      'followers',
      'phoneNumber',
      'removed',
      'parent',
    ]);
  });
});

describe('Dogma#getProperties', () => {
  const properties = User.getProperties();

  test('must have keys', () => {
    expect(properties[0].key).toBe('id');
    expect(properties[4].key).toBe('email');
  });

  test('key map must match index', () => {
    expect(properties.keyMap.id).toBe(0);
    expect(properties.keyMap.email).toBe(4);
  });
});

describe('Dogma.forge', () => {
  test('forge with defaults', () => {
    const user = User.forge({
      id: '1',
      email: 'example@example',
      givenName: 'John',
      familyName: 'Doe',
      phoneNumber: null,
    });
    expect(user.givenName).toBe('John');
    expect(user.familyName).toBe('Doe');
    expect(user.displayName).toBe('John Doe');
  });

  test('forge without defaults', () => {
    const registeredAt = new Date();

    const user = User.forge({
      id: '1',
      email: 'example@example',
      givenName: 'John',
      familyName: 'Doe',
      displayName: 'Doe, John',
      registeredAt,
      status: UserStatus.INACTIVE,
      phoneNumber: null,
    });

    user.followers = [
      User.forge({
        id: '2',
        email: 'another@another',
        givenName: 'Anna',
        familyName: 'Doe',
        phoneNumber: null,
      }),
    ];

    user.parent = User.forge({
      id: '2',
      email: 'another@another',
      givenName: 'Anna',
      familyName: 'Doe',
      phoneNumber: null,
    });

    expect(user.displayName).toBe('Doe, John');
    expect(user.registeredAt).toBe(registeredAt);
    expect(user.status).toBe(UserStatus.INACTIVE);
  });
});

describe('Factory', () => {
  test('from values', () => {
    const registeredAt = new Date();
    const user = User.fromValues([
      '1',
      'John',
      'Doe',
      'Doe, John',
      'example@example',
      registeredAt,
      UserStatus.INACTIVE,
      [],
      null,
      false,
      null,
    ]);
    expect(user.displayName).toBe('Doe, John');
    expect(user.registeredAt).toBe(registeredAt);
    expect(user.status).toBe(UserStatus.INACTIVE);
  });

  test('from plain object', () => {
    const registeredAt = new Date();
    const user = User.forge({
      id: '1',
      email: 'example@example',
      givenName: 'John',
      familyName: 'Doe',
      displayName: 'Doe, John',
      registeredAt,
      status: UserStatus.INACTIVE,
      followers: [],
      phoneNumber: null,
      removed: false,
      parent: null,
    });
    expect(user.displayName).toBe('Doe, John');
    expect(user.registeredAt).toBe(registeredAt);
    expect(user.status).toBe(UserStatus.INACTIVE);
  });


  test('from JSON', () => {
    const registeredAt = new Date();
    const user = User.forge({
      id: '1',
      email: 'example@example',
      givenName: 'John',
      familyName: 'Doe',
      displayName: 'Doe, John',
      registeredAt,
      phoneNumber: null,
    });

    const parsedUser = User.fromJSONString(
      JSON.stringify(user),
    );

    expect(parsedUser.displayName).toBe('Doe, John');
    expect(parsedUser.registeredAt === registeredAt).toBe(false);
    expect(parsedUser.registeredAt).toStrictEqual(registeredAt);
    expect(parsedUser.status).toEqual(UserStatus.ACTIVE);
  });

  test('stringify', () => {
    const registeredAt = new Date('2020-01-21T02:48:39.918Z');
    const user = User.forge({
      id: '1',
      email: () => 'example@example',
      givenName: 'John',
      familyName: 'Doe',
      displayName: 'Doe, John',
      registeredAt,
      phoneNumber: null,
    });

    const str = user.stringify();
    const parsedUser = User.decode(str);
    expect(parsedUser.displayName).toBe('Doe, John');
    expect(parsedUser.registeredAt === registeredAt).toBe(false);
    expect(parsedUser.registeredAt).toStrictEqual(registeredAt);
    expect(parsedUser.status).toBe(UserStatus.ACTIVE);
  });
});


describe('FactoryMixin', () => {
  @Dogma()
  class Node extends Dogma.Object {
    static myStaticProperty() {}

    id = Dogma[0].required(String);

    myMemberProperty() {}
  }

  @Dogma()
  class User extends Node {
    displayName = Dogma[1].required(String);
    registeredAt = Dogma[2].optional(Date, () => new Date('2020-01-21T02:48:39.918Z'));
  }

  test('An extended class must be inherit static and member methods', () => {
    expect(User.myStaticProperty).toBe(Node.myStaticProperty);
    expect(User.prototype.myMemberProperty).toBe(Node.prototype.myMemberProperty);
  });

  test('To values', () => {
    const user = User.forge({ id: '1', displayName: 'John' });
    expect(user.myMemberProperty).toBe(Node.prototype.myMemberProperty);
    expect(user.toValues()).toStrictEqual(['1', 'John', new Date('2020-01-21T02:48:39.918Z')]);
  });
});