import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidatorFn } from '@angular/forms';

@Directive({
  selector: '[appWachtwoordSterkteValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: WachtwoordSterkteValidatorDirective,
      multi: true,
    },
  ],
})
export class WachtwoordSterkteValidatorDirective {
  // todo controleer regex
  // Moet controleren op:
  // Minimaal 4 lengte
  // Minimaal 1 hoofdletter
  // Minimaal 1 cijfer
  // Minimaal 1 kleine letter
  // Testen kunnen worden uitgevoerd met ng test, en staan in de bijbehorende -spec.ts file.
  // Als regex niet matched wordt er een object teruggegeven:  {forbiddenPassword: {value: DE_GECONTROLEERDE_VALUE}}
  // Als regex wel matched, wordt er null teruggegeven. Dan is het wachtwoord sterk
  readonly regex = '(?=^.{4,}$)(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z])';

  validate(control: AbstractControl): Record<string, any> | null {
    return this.regexValidator(new RegExp(this.regex))(control);
  }

  regexValidator(nameRe: RegExp): ValidatorFn {
    return (control: AbstractControl): Record<string, any> | null => {
      if (control.value === '' || !control.value) {
        return null;
      }
      const isStrongPassword = nameRe.test(control.value);
      return isStrongPassword ? null : {forbiddenPassword: {value: control.value}};
    };
  }

}
