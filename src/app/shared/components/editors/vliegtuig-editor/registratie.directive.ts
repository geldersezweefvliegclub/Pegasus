import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator, ValidatorFn } from '@angular/forms';

@Directive({
    selector: '[appRegistratieDirective]',
    providers: [{ provide: NG_VALIDATORS, useExisting: RegistratieDirective, multi: true }]
})
export class RegistratieDirective implements Validator {

    validate(control: AbstractControl): ValidationErrors | null {
        return this.regexValidator(new RegExp(/[A-Z]*-[0-Z][0-Z]*/))(control);
    }

    regexValidator(nameRe: RegExp): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (control.value === '') {
                return null;
            }

            const forbidden = !nameRe.test(control.value);
            return forbidden ? {forbiddenPassword: {value: control.value}} : null;
        };
    }
}
