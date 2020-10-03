---
id: usage
title: Usage
---

## Creating a simple object schema

```typescript
import Dogma from 'dogmajs';

@Dogma()
export class User extends Dogma.Object {
  readonly id = Dogma[0].required(String);
  readonly displayName = Dogma[1].required(String);
  readonly login = Dogma[2].required(String);
  readonly password = Dogma[3].optional(String);
  readonly isActive = Dogma[4].optional(Boolean, false);
  readonly registeredAt = Dogma[5].required(Date);
}
```

## Forging And Cloning

```typescript
const user = User.forge({
  id: '1',
  displayName: 'John',
  login: 'john',
  registeredAt: new Date(),
});

Dogma.clone(user, {
  displayName: 'Big John',
});
```
