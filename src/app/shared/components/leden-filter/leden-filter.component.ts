import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { SharedService } from '../../../services/shared/shared.service';
import { LoginService } from '../../../services/apiservice/login.service';


@Component({
    selector: 'app-leden-filter',
    templateUrl: './leden-filter.component.html',
    styleUrls: ['./leden-filter.component.scss']
})

export class LedenFilterComponent {
    @Input() LedenDDWV = true;
    @Output() filterChanged: EventEmitter<void> = new EventEmitter<void>();

    @ViewChild(ModalComponent) private popup: ModalComponent;

    isBeheerder: boolean;
    isDDWVer: boolean;

    constructor(private readonly loginService: LoginService, readonly sharedService: SharedService) {
    }

    // Open leden-filter dialoog met de leden-filter opties
    openPopup() {
        const ui = this.loginService.userInfo;
        this.isBeheerder = ui!.Userinfo?.isBeheerder ?? false;
        this.isDDWVer = ui!.Userinfo?.isDDWV ?? false;

        this.popup.open();
    }

    // Er is een leden-filter gewijzigd, meteen aan parent melden zodat starts opgehaald kan worden
    filterDataChanged() {
        this.filterChanged.emit();
    }

    // DDWV en leden mogen niet tegelijk 'aan' staan, dan is dataset altijd leeg
    filterLedenChanged(checked: boolean) {
        if ((checked) && ((this.sharedService.ledenlijstFilter.ddwv) || this.sharedService.ledenlijstFilter.wachtlijst)) {
            this.sharedService.ledenlijstFilter.ddwv = false;
            this.sharedService.ledenlijstFilter.wachtlijst = false;
        }
        this.filterChanged.emit();
    }

    // DDWV en leden mogen niet tegelijk 'aan' staan, dan is dataset altijd leeg
    filterDDWVChanged(checked: boolean) {
        if ((checked) && ((this.sharedService.ledenlijstFilter.leden) || this.sharedService.ledenlijstFilter.wachtlijst)) {
            this.sharedService.ledenlijstFilter.leden = false;
            this.sharedService.ledenlijstFilter.wachtlijst = false;
        }
        this.filterChanged.emit();
    }

    // DDWV en leden en wachtlijst mogen niet tegelijk 'aan' staan, dan is dataset altijd leeg
    filterWachtlijstChanged(checked: boolean) {
        if ((checked) && ((this.sharedService.ledenlijstFilter.leden) || this.sharedService.ledenlijstFilter.ddwv)) {
            this.sharedService.ledenlijstFilter.leden = false;
            this.sharedService.ledenlijstFilter.ddwv = false;
        }
        this.filterChanged.emit();
    }
}
