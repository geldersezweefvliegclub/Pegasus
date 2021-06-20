import {RegistratieDirective} from './registratie.directive';
import {FormControl} from '@angular/forms';

describe('RegistratieDirective', () => {
  let sut: RegistratieDirective;
  beforeEach(() => {
    sut = new RegistratieDirective();
  });

  it('should create an instance', () => {
    expect(sut).toBeTruthy();
  });

  it('should reject numeric value', () => {
    expect(sut.validate(new FormControl('123456'))).toEqual(
      {forbiddenName: {value: '123456'}});
  });

  it('should return null when empty string is passed', () => {
    expect(sut.validate(new FormControl(''))).toEqual(null);
  });

  it('should reject string that does not match regex', () => {
    expect(sut.validate(new FormControl('hello'))).toEqual(
      {forbiddenName: {value: 'hello'}});
  });

  it('should return null when valid REGISTRATIE is passed', () => {
    expect(sut.validate(new FormControl('PH-721'))).toEqual(null);
  });

  it('should return error when valid REGISTRATIE is passed with lowercase letters', () => {
    expect(sut.validate(new FormControl('ph-721'))).toEqual({forbiddenName: {value: 'ph-721'}});
  });

  it('should return error when invalid REGISTRATIE is passed ', () => {
    expect(sut.validate(new FormControl('PH-'))).toEqual({forbiddenName: {value: 'PH-'}});
  });
});
