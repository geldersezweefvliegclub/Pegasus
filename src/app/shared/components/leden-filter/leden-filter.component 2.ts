import { Component, inject, input, output, viewChild } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { SharedService } from '../../../services/shared/shared.service';
import { LoginService } from '../../../services/apiservice/login.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-leden-filter',
    templateUrl: './leden-filter.component.html',
    styleUrls: ['./leden-filter.component.scss'],
    imports: [ModalComponent, FormsModule]
})

export class LedenFilterComponent {
    readonly LedenDDWV = input(true);
    readonly Beheerders = input(true);          // filter op (DDWV) beheerders, niet zinvol in het rooster
    readonly filterChanged = output<void>();

    // variablen in html formulier
    protected readonly sharedService = inject(SharedService);

    protected isBeheerder: boolean;
    protected isBeheerderDDWV: boolean;
    protected isDDWVer: boolean;

    // private variable voor ts script
    private readonly loginService = inject(LoginService);
    private readonly popup = viewChild.required(ModalComponent);

    // Open leden-filter dialoog met de leden-filter opties
    openPopup() {
        const ui = this.loginService.userInfo;
        this.isBeheerder = ui!.Userinfo?.isBeheerder ?? false;
        this.isBeheerderDDWV = ui!.Userinfo?.isBeheerderDDWV ?? false;
        this.isDDWVer = ui!.Userinfo?.isDDWV ?? false;

        this.popup().open();
    }

    // Er is een leden-filter gewijzigd, meteen aan parent melden zodat starts opgehaald kan worden
    protected filterDataChanged() {
        this.filterChanged.emit();
    }

    // DDWV en leden mogen niet tegelijk 'aan' staan, dan is dataset altijd leeg
    protected filterLedenChanged(checked: boolean) {
        if ((checked) && ((this.sharedService.ledenlijstFilter.ddwv) || this.sharedService.ledenlijstFilter.wachtlijst)) {
            this.sharedService.ledenlijstFilter.ddwv = false;
            this.sharedService.ledenlijstFilter.wachtlijst = false;
        }
        this.filterChanged.emit();
    }

    // DDWV en leden mogen niet tegelijk 'aan' staan, dan is dataset altijd leeg
    protected filterDDWVChanged(checked: boolean) {
        if ((checked) && ((this.sharedService.ledenlijstFilter.leden) || this.sharedService.ledenlijstFilter.wachtlijst)) {
            this.sharedService.ledenlijstFilter.leden = false;
            this.sharedService.ledenlijstFilter.wachtlijst = false;
        }
        this.filterChanged.emit();
    }

    // DDWV en leden en wachtlijst mogen niet tegelijk 'aan' staan, dan is dataset altijd leeg
    protected filterWachtlijstChanged(checked: boolean) {
        if ((checked) && ((this.sharedService.ledenlijstFilter.leden) || this.sharedService.ledenlijstFilter.ddwv)) {
            this.sharedService.ledenlijstFilter.leden = false;
            this.sharedService.ledenlijstFilter.ddwv = false;
        }
        this.filterChanged.emit();
    }
}
