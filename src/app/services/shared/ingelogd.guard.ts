import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../apiservice/login.service';
import { StorageService } from '../storage/storage.service';

// Schermen zijn alleen beschikbaar als we ingelogd zijn, anders gaan we naar de login pagina
export const ingelogdGuard: CanActivateFn = (_route, state) => {
    if (inject(LoginService).isIngelogd()) {
        return true;
    }

    // onthoud waar we naar toe wilden, na inloggen gaat de login pagina hier naar toe
    inject(StorageService).opslaan("url", state.url, 5);
    return inject(Router).createUrlTree(['login']);
};
