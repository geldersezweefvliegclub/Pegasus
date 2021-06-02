import {Directive} from '@angular/core';
import {AbstractControl, NG_VALIDATORS, Validator, ValidatorFn} from '@angular/forms';

@Directive({
  selector: '[appRegistratie]',
  providers: [[{provide: NG_VALIDATORS, useExisting: RegistratieDirective, multi: true}]]
})
export class RegistratieDirective implements Validator {

  validate(control: AbstractControl): { [key: string]: any } | null {
    return this.regexValidator(new RegExp(/[A-Z]*-[0-Z][0-Z]*/))(control);
  }

  regexValidator(nameRe: RegExp): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (control.value === '') {
        return null;
      }

      const forbidden = !nameRe.test(control.value);
      return forbidden ? {forbiddenName: {value: control.value}} : null;
    };
  }
}
