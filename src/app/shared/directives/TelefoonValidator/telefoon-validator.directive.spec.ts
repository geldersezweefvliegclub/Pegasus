import {TelefoonValidatorDirective} from './telefoon-validator.directive';
import {FormControl} from '@angular/forms';

describe('TelefoonDirective', () => {
  let sut: TelefoonValidatorDirective;

  beforeEach(() => {
    sut = new TelefoonValidatorDirective();
  });

  it('should create an instance', () => {
    const directive = new TelefoonValidatorDirective();
    expect(directive).toBeTruthy();
  });

  it('should return null when empty string is passed', () => {
    expect(sut.validate(new FormControl(''))).toEqual(null);
  });

  it('should reject string that is not a phone number', () => {
    expect(sut.validate(new FormControl('hello'))).toEqual(
      {forbiddenName: {value: 'hello'}});
  });

  it('should return null when valid mobile number is passed', () => {
    expect(sut.validate(new FormControl('0614414803'))).toEqual(null);
  });

  it('should return null when valid mobile number is passed with -', () => {
    expect(sut.validate(new FormControl('06-14414803'))).toEqual(null);
  });

  it('should return null when valid mobile number is passed in different format', () => {
    expect(sut.validate(new FormControl('+31614414803'))).toEqual(null);
  });

  it('should return null when valid home number is passed', () => {
    expect(sut.validate(new FormControl('0313651348'))).toEqual(null);
  });

  it('should return null when valid home number is passed with -', () => {
    expect(sut.validate(new FormControl('0313-651348'))).toEqual(null);
  });
});
