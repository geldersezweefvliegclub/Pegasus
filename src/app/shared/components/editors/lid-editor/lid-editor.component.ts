import {ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgbDate, NgbDateParserFormatter} from '@ng-bootstrap/ng-bootstrap';
import {DateTime} from 'luxon';
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faEye, faEyeSlash, faInfo, faInfoCircle, faUser} from '@fortawesome/free-solid-svg-icons';
import {TypesService} from '../../../../services/apiservice/types.service';
import {HeliosLid, HeliosType} from '../../../../types/Helios';
import {LedenService} from '../../../../services/apiservice/leden.service';
import {LoginService} from "../../../../services/apiservice/login.service";
import {NgbDateFRParserFormatter} from "../../../ngb-date-fr-parser-formatter";

@Component({
    selector: 'app-lid-editor',
    templateUrl: './lid-editor.component.html',
    styleUrls: ['./lid-editor.component.scss'],
    providers: [{provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter}]
})
export class LidEditorComponent implements OnInit {
    @Input() lidID: number;
    @Input() isVerwijderMode: boolean = false;
    @Input() isRestoreMode: boolean = false;

    @Output() opslaan: EventEmitter<HeliosLid> = new EventEmitter<HeliosLid>();
    @Output() opslaanAvatar: EventEmitter<string> = new EventEmitter<string>();

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

    MedicalDatum: NgbDate | null;
    GeboorteDatum: NgbDate | null;

    constructor(
        private readonly typeService: TypesService,
        private readonly ledenService: LedenService,
        private readonly loginService: LoginService,
        private readonly changeDetector: ChangeDetectorRef) {}

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

                    // gebruik twee locale variable voor datum ingave
                    this.MedicalDatum = this.converteerDatumNaarNgbDate(lid.MEDICAL);
                    this.GeboorteDatum = this.converteerDatumNaarNgbDate(lid.GEBOORTE_DATUM);
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

            this.MedicalDatum = null;
            this.GeboorteDatum = null;
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

        // en nu de twee locale variablen terug in het object zetten
        if (this.GeboorteDatum != null) {
            this.lid.GEBOORTE_DATUM = this.converteerDatumNaarISO(this.GeboorteDatum);
        }
        else {
            this.lid.GEBOORTE_DATUM = undefined;
        }

        if (this.MedicalDatum != null) {
            this.lid.MEDICAL = this.converteerDatumNaarISO(this.MedicalDatum);
        }
        else {
            this.lid.MEDICAL = undefined;
        }

        // nu opslaan van de data
        this.opslaan.emit(this.lid);
    }

    converteerDatumNaarISO($event: NgbDate): string {
        const unformatted = DateTime.fromObject($event);
        return unformatted.isValid ? unformatted.toISODate().toString() : '';
    }

    converteerDatumNaarNgbDate(datum: string | undefined): NgbDate|null {
        if (datum) {
            return NgbDate.from(DateTime.fromSQL(datum));
        }
        else
            return null;
    }

    verbergWachtwoord() {
        this.wachtwoordVerborgen = !this.wachtwoordVerborgen;
        this.oogIcon = this.wachtwoordVerborgen ? faEye : faEyeSlash;
    }

    setAvatar($event: string) {
        this.avatar = $event;
        this.changeDetector.detectChanges();
    }

    // nu opslaan van de avatar
    uploadFoto(image: string) {
        this.setAvatar(image);
        this.opslaanAvatar.emit(image);
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
        const ui = this.loginService.userInfo?.Userinfo;

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
                if (ui?.isBeheerder || ui?.isBeheerderDDWV) {
                    return false;
                }
                break;
            }
            case 'LIERIST':
            case 'STARTLEIDER': {
                if (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isRooster) {
                    return false;
                }
                break;
            }
            case 'CIMT':
            case 'STARTTOREN':
            case 'ROOSTER':
            case 'BEHEERDER':
            case 'DDWV_BEHEERDER':
            case 'betaald': {
                if (ui?.isBeheerder) {
                    return false;
                }
                break;
            }
            case 'INSTRUCTEUR': {
                if (ui?.isBeheerder || ui?.isCIMT) {
                    return false;
                }
                break;
            }
            case 'DDWV_CREW': {
                if (ui?.isBeheerder || ui?.isBeheerderDDWV) {
                    return false;
                }
                break;
            }

            case 'limitaties': {
                if (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isCIMT || ui?.isRooster) {
                    return false;
                }
                break;
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
        const ui = this.loginService.userInfo?.Userinfo;

        if (this.isRestoreMode || this.isVerwijderMode) {
            return false;
        }

        if (ui?.isBeheerder || ui?.isBeheerderDDWV) {
            return true;
        }
        return false;
    }
}
