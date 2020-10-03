/// <reference types="jest" />
import { crc16 } from './crc16';

describe('CRC16/ARC', () => {
  test('Must match', () => {
    expect(crc16(Buffer.from('123456789')).toString(16)).toBe('bb3d');
    expect(crc16(Buffer.from('My Text')).toString(16)).toBe('6235');
  });
});