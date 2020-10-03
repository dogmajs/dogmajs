import { DogmaObject, DogmaObjectStatic } from './Dogma';

export function isDogma(value: any): value is DogmaObjectStatic<DogmaObject> {
  return value.prototype instanceof DogmaObject;
}