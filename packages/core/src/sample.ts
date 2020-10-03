import Dogma from '.';
// import Dogma from '@dogmajs/core';
enum Sample {
  A = 1,
  B = 2
}

@Dogma()
export class PriceRangeCursor extends Dogma.Object {
  priceRangeIdx = Dogma[0].required(String);
  children = Dogma[1].repeated(PriceRangeCursor);
  test = Dogma[4].optional(Sample, Sample.A);
  test2 = Dogma[3].optional(Boolean, true);
  registeredAt = Dogma[5].optional(Date, def => new Date());
}

const cursor2 = PriceRangeCursor.fromValues(['2', null, undefined, true, Sample.B, new Date()]);
console.log('cursor2', cursor2);

const cursor = PriceRangeCursor.forge({
  priceRangeIdx: '1',
});

PriceRangeCursor.clone(cursor, {
  priceRangeIdx: '',
});


/*
const { type, payload } = Dogma.decodeType(str);
PriceRangeCursor.decode(str);
*/

console.log('decoded', PriceRangeCursor.parse(cursor.stringify()));