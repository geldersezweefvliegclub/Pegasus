import {Directive} from '@angular/core';
import {AbstractControl, NG_VALIDATORS, ValidatorFn} from '@angular/forms';

@Directive({
  selector: '[appTelefoonValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: TelefoonValidatorDirective,
      multi: true,
    },
  ],
})
export class TelefoonValidatorDirective {

  readonly regex =
    '(^\\+[0-9]{2}|^\\+[0-9]{2}\\(0\\)|^\\(\\+[0-9]{2}\\)\\(0\\)|^00[0-9]{2}|^0)([0-9]{9}$|[0-9\\-\\s]{10}$)';

  validate(control: AbstractControl): Record<string, any> | null {
    return this.regexValidator(new RegExp(this.regex, 'i'))(control);
  }

  regexValidator(nameRe: RegExp): ValidatorFn {
    return (control: AbstractControl): Record<string, any> | null => {
      if (control.value === '' || !control.value) {
        return null;
      }
      const forbidden = !nameRe.test(control.value);
      return forbidden ? { forbiddenName: { value: control.value } } : null;
    };
  }

}
