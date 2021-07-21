import {WachtwoordSterkteValidatorDirective} from './wachtwoord-sterkte-validator.directive';
import {FormControl} from '@angular/forms';

describe('WachtwoordSterkteDirective', () => {
  let sut: WachtwoordSterkteValidatorDirective;

  beforeEach(() => {
    sut = new WachtwoordSterkteValidatorDirective();
  });

  it('should create an instance', () => {
    const directive = new WachtwoordSterkteValidatorDirective();
    expect(directive).toBeTruthy();
  });

  it('should return null when empty string is passed', () => {
    expect(sut.validate(new FormControl(''))).toEqual(null);
  });

  it('should return null when minimum strong password is passed', () => {
    expect(sut.validate(new FormControl('aA1b'))).toEqual(null);
  });

  it('should reject string that is not 4 characters long', () => {
    expect(sut.validate(new FormControl('h'))).toEqual(
      {forbiddenPassword: {value: 'h'}});
  });

  it('should reject string that is missing a capital letter', () => {
    expect(sut.validate(new FormControl('aa1b'))).toEqual(
      {forbiddenPassword: {value: 'aa1b'}});
  });

  it('should reject string that is missing a small letter', () => {
    expect(sut.validate(new FormControl('AA1B'))).toEqual(
      {forbiddenPassword: {value: 'AA1B'}});
  });

  it('should reject string that is missing a number', () => {
    expect(sut.validate(new FormControl('AABB'))).toEqual(
      {forbiddenPassword: {value: 'AABB'}});
  });

  it('should accept string that a longer than 4 characters', () => {
    expect(sut.validate(new FormControl('AAAA111BBBbbb'))).toEqual(null);
  });

  it('should reject string with only lowercase', () => {
    expect(sut.validate(new FormControl('abc'))).toEqual({forbiddenPassword: {value: 'abc'}});
  });
});
