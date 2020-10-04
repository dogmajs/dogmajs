import { DogmaObject, DogmaObjectForgeable } from './Dogma';

export function isDogma(value: any): value is DogmaObjectForgeable<DogmaObject> {
  return value.prototype instanceof DogmaObject;
}