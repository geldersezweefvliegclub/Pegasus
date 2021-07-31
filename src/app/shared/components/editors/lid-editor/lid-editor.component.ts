import {ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgbDate} from '@ng-bootstrap/ng-bootstrap';
import {DateTime} from 'luxon';
import {faEye, faEyeSlash, faInfo, faInfoCircle, faUser} from '@fortawesome/free-solid-svg-icons';
import {TypesService} from '../../../../services/apiservice/types.service';
import {HeliosLid, HeliosType} from '../../../../types/Helios';
import {LedenService} from '../../../../services/apiservice/leden.service';
import {ImageService} from '../../../../services/apiservice/image.service';
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {LoginService} from "../../../../services/apiservice/login.service";

@Component({
    selector: 'app-lid-editor',
    templateUrl: './lid-editor.component.html',
    styleUrls: ['./lid-editor.component.scss']
})
export class LidEditorComponent implements OnInit {
    @Input() lidID: number;
    @Input() isVerwijderMode: boolean = false;
    @Input() isRestoreMode: boolean = false;

    @Output() opslaan: EventEmitter<HeliosLid> = new EventEmitter<HeliosLid>();
    lid: HeliosLid = {};
    types: HeliosType[];

    wachtwoordVerborgen: boolean = true;
    oogIcon: IconDefinition = faEye;
    informatieIcon: IconDefinition = faInfo;
    infoIcon: IconDefinition = faInfoCircle;
    persoonIcon: IconDefinition = faUser;

    controleWachtwoord: string = '';
    wachtwoord: string = '';

    subtitel: string = 'Instellen van gegevens en voorkeuren';
    titel: string = 'Aanpassen profiel';
    avatar: string | null | undefined;

    isLoading: boolean = false;

    constructor(
        private readonly typeService: TypesService,
        private readonly ledenService: LedenService,
        private readonly imageService: ImageService,
        private readonly loginService: LoginService,
        private readonly changeDetector: ChangeDetectorRef
    ) {
    }

    ngOnInit(): void {
        this.typeService.getTypes(6).then(types => this.types = types);

        if (this.lidID > 0) {
            this.isLoading = true;

            if (this.isRestoreMode) {
                this.titel = 'Lid herstellen';
                this.subtitel = 'Een oud lid is weer terug, maak de verwijdering ongedaan';
            }
            else if (this.isVerwijderMode) {
                this.titel = 'Lid verwijderen';
                this.subtitel = 'Geen lid meer dan markeren als verwijderd';
            }

            try {
                this.ledenService.getLid(this.lidID).then((lid: HeliosLid) => {
                    this.lid = lid;
                    this.avatar = lid.AVATAR;
                    this.isLoading = false;
                });
            }
            catch(e) {
                this.isLoading = false;
            }
        } else {
            this.titel = 'Lid aanmaken';
            this.subtitel = 'Toevoegen van een nieuw lid';
            this.lid = {
                GEBOORTE_DATUM: '',
                MEDICAL: ''
            };
        }
    }

    // opslaan van data
    uitvoeren() {
        // even kijken of wachtwoorden ingevuld en goed zijn
        if (this.wachtwoord === '' || (this.controleWachtwoord !== this.wachtwoord)) {
            this.lid.WACHTWOORD = undefined;
        } else {
            this.lid.WACHTWOORD = this.wachtwoord;
        }

        // nu opslaan van de data
        this.opslaan.emit(this.lid);
    }

    converteerDatumNaarISO($event: NgbDate): string {
        const unformatted = DateTime.fromObject($event);
        return unformatted.isValid ? unformatted.toISODate().toString() : '';
    }

    verbergWachtwoord() {
        this.wachtwoordVerborgen = !this.wachtwoordVerborgen;
        this.oogIcon = this.wachtwoordVerborgen ? faEye : faEyeSlash;
    }

    setAvatar($event: string) {
        this.avatar = $event;
        this.changeDetector.detectChanges();
    }

    uploadFoto($event: string) {
        this.setAvatar($event);
        this.imageService.uploadFoto(this.lid.ID as number, $event).then();
    }

    isgoogleAuthNodig(): boolean {
        if (this.lid.BEHEERDER || this.lid.DDWV_BEHEERDER || this.lid.INSTRUCTEUR || this.lid.CIMT ||
            this.lid.DDWV_CREW || this.lid.ROOSTER || this.lid.STARTTOREN) {
            this.lid.AUTH = true;
            return true;
        }
        return false;
    }

    // Logica om te bepalen of je veld wel/niet mag invullen
    isDisabled(veld: string) {
        let ui = this.loginService.userInfo?.Userinfo;

        if (this.isRestoreMode || this.isVerwijderMode) {
            return true;
        }

        switch (veld) {
            case 'googleAuth': {
                return this.isgoogleAuthNodig();
            }
            case 'gebruiker':
            case 'lidnummer':
            case 'lidmaatschap': {
                if (ui?.isBeheerder || ui?.isBeheerderDDWV)
                    return false;
            }
            case 'LIERIST':
            case 'STARTLEIDER': {
                if (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isRooster)
                    return false;
            }
            case 'CIMT':
            case 'STARTTOREN':
            case 'ROOSTER':
            case 'BEHEERDER':
            case 'DDWV_BEHEERDER':
            case 'STARTLEIDER':
            case 'betaald': {
                if (ui?.isBeheerder)
                    return false;
            }
            case 'INSTRUCTEUR': {
                if (ui?.isBeheerder || ui?.isCIMT)
                    return false;
            }
            case 'DDWV_CREW': {
                if (ui?.isBeheerder || ui?.isBeheerderDDWV)
                    return false;
            }

            case 'limitaties': {
                if (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isCIMT || ui?.isRooster)
                    return false;
            }

            default:
                console.log("Veld " + veld + " niet in switch");
        }
        return true;
    }

    // Als veld disabled is, dan extra class toevoegen voor label
    disabledClass(veld: string) {
        if (this.isDisabled(veld)) {
            return "disableVeld";
        }
        return '';
    }

    // Toon de QR code voor Google Authenticator
    toonSecret() {
        let ui = this.loginService.userInfo?.Userinfo;

        if (this.isRestoreMode || this.isVerwijderMode) {
            return false;
        }

        if (ui?.isBeheerder || ui?.isBeheerderDDWV) {
            return true;
        }
        return false;
    }
}
