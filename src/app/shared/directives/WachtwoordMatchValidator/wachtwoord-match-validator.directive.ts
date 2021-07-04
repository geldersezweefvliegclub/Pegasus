import {Directive} from '@angular/core';
import {AbstractControl, ValidationErrors} from '@angular/forms';

@Directive({
  selector: '[appWachtwoordMatchValidator]'
})
export class WachtwoordMatchValidatorDirective {

  validate(control: AbstractControl): ValidationErrors | null {
    const name = control.get('name');
    const alterEgo = control.get('alterEgo');

    return name && alterEgo && name.value === alterEgo.value ? { identityRevealed: true } : null;
  }
}
