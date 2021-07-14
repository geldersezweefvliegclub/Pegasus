import {Directive} from '@angular/core';
import {FormGroup, NG_VALIDATORS, ValidationErrors} from '@angular/forms';

@Directive({
  selector: '[appWachtwoordMatchValidator]',
  providers: [{provide: NG_VALIDATORS, useExisting: WachtwoordMatchValidatorDirective, multi: true}]
})
export class WachtwoordMatchValidatorDirective {

  validate(control: FormGroup): ValidationErrors | null {
    const wachtwoord = control.get('wachtwoord');
    const controleWachtwoord = control.get('herhaalwachtwoord');
    console.log(wachtwoord, controleWachtwoord)

    if (wachtwoord && controleWachtwoord && wachtwoord.value === controleWachtwoord.value){
      wachtwoord?.setErrors(null)
      controleWachtwoord?.setErrors(null)
      return null
    } else{
      const error = {wachtwoordMatch: false}
      wachtwoord?.setErrors(error)
      controleWachtwoord?.setErrors(error)
      return error
    }
  }
}
