export interface DogmaNullableStatic {
  <T>(type: T): DogmaNullableMember<T>;
  new <T>(type: T): DogmaNullableMember<T>;
}

export interface DogmaNullableMember<T> {
  __nullable: true;
  type: T;
}

export const DogmaNullable = (function DogmaNullable(this: DogmaNullableMember<any>, type: string) {
  if (!(this instanceof DogmaNullable)) {
    return new (DogmaNullable as DogmaNullableStatic)(type);
  }
  this.type = type;
  return this;
} as any) as DogmaNullableStatic;