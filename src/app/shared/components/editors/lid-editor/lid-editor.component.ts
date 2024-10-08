import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbDate, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { DateTime } from 'luxon';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { faEye, faEyeSlash, faInfo, faInfoCircle, faUser } from '@fortawesome/free-solid-svg-icons';
import { TypesService } from '../../../../services/apiservice/types.service';
import { HeliosLedenDataset, HeliosLid, HeliosType } from '../../../../types/Helios';
import { LedenService } from '../../../../services/apiservice/leden.service';
import { LoginService } from '../../../../services/apiservice/login.service';
import { NgbDateFRParserFormatter } from '../../../ngb-date-fr-parser-formatter';
import { ErrorMessage, SuccessMessage } from '../../../../types/Utils';
import { ImageService } from '../../../../services/apiservice/image.service';
import { Router } from '@angular/router';
import { StorageService } from '../../../../services/storage/storage.service';
import { Subscription } from 'rxjs';
import { SchermGrootte, SharedService } from '../../../../services/shared/shared.service';
import { TransactiesComponent } from '../../transacties/transacties.component';
import { PegasusConfigService } from '../../../../services/shared/pegasus-config.service';
import { DdwvService } from '../../../../services/apiservice/ddwv.service';

@Component({
    selector: 'app-lid-editor',
    templateUrl: './lid-editor.component.html',
    styleUrls: ['./lid-editor.component.scss'],
    providers: [{provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter}]
})
export class LidEditorComponent implements OnInit, OnDestroy {
    @Input() lidID: number;
    @Input() isVerwijderMode = false;
    @Input() isRestoreMode = false;

    @ViewChild(TransactiesComponent) transactieScherm: TransactiesComponent;

    private resizeSubscription: Subscription;       // Abonneer op aanpassing van window grootte (of draaien mobiel)
    private ledenAbonnement: Subscription;
    instructeurs: HeliosLedenDataset[] = [];
    zusterclubs: HeliosLedenDataset[] = []

    private typesAbonnement: Subscription;
    lidTypes: HeliosType[];
    statusTypes: HeliosType[];
    lid: HeliosLid = {};

    wachtwoordVerborgen = true;
    oogIcon: IconDefinition = faEye;
    readonly informatieIcon: IconDefinition = faInfo;
    readonly infoIcon: IconDefinition = faInfoCircle;
    readonly persoonIcon: IconDefinition = faUser;

    controleWachtwoord = '';
    wachtwoord = '';

    subtitel = 'Instellen van gegevens en voorkeuren';
    titel = 'Aanpassen profiel';
    avatar: string | null | undefined;

    isLoading = false;
    isSaving = false;
    isMobiel = true;

    saldoTonen = false;

    MedicalDatum: NgbDate | null;
    GeboorteDatum: NgbDate | null;

    vandaag: DateTime = DateTime.now();

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    constructor(
        private readonly router: Router,
        private readonly ddwvService: DdwvService,
        private readonly typesService: TypesService,
        private readonly ledenService: LedenService,
        private readonly loginService: LoginService,
        private readonly imageService: ImageService,
        private readonly sharedService: SharedService,
        private readonly storageService: StorageService,
        private readonly configService: PegasusConfigService,
        private readonly changeDetector: ChangeDetectorRef) {
    }

    ngOnInit(): void {
        this.onWindowResize();

        // abonneer op wijziging van lidTypes
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.lidTypes = dataset!.filter((t: HeliosType) => { return t.GROEP == 6  });          // lidtypes
            this.statusTypes = dataset!.filter((t: HeliosType) => { return t.GROEP == 19  });      // status types (DBO, solo, brevet)```````
        });

        // abonneer op wijziging van leden, maar hebben alleen instructeurs nodig
        this.ledenAbonnement = this.ledenService.ledenChange.subscribe(leden => {
            this.zusterclubs = (leden) ? leden.filter((lid) => lid.LIDTYPE_ID == 607) : [];
            this.instructeurs = (leden) ? leden.filter((lid) => lid.INSTRUCTEUR == true) : [];

            if (!leden) {
                this.instructeurs = [];
            }
            else {
                this.instructeurs = leden.filter((lid: HeliosLedenDataset) => {
                    return lid.INSTRUCTEUR;
                });
            }
        })

        // Roep onWindowResize aan zodra we het event ontvangen hebben
        this.resizeSubscription = this.sharedService.onResize$.subscribe(() => {
            this.onWindowResize();
        });

        this.opvragen();
    }

    ngOnDestroy() {
        if (this.resizeSubscription) this.resizeSubscription.unsubscribe();
    }

    onWindowResize() {
        this.isMobiel = (this.sharedService.getSchermSize() <= SchermGrootte.md);
    }

    // opvragen van lid informatie, of creeer nieuw lid
    opvragen() {
        this.saldoTonen = false;

        // als lidID > 0, dan wijzigen we een bestaand lid profiel
        if (this.lidID >= 0) {
            this.isLoading = true;

            if (this.isRestoreMode) {
                this.titel = 'Lid herstellen';
                this.subtitel = 'Een oud lid is weer terug, maak de verwijdering ongedaan';
            } else if (this.isVerwijderMode) {
                this.titel = 'Lid verwijderen';
                this.subtitel = 'Geen lid meer dan markeren als verwijderd';
            }

            try {
                this.ledenService.getLid(this.lidID).then((lid: HeliosLid) => {
                    this.lid = lid;

                    // gebruik twee locale variable voor datum ingave
                    this.MedicalDatum = this.converteerDatumNaarNgbDate(lid.MEDICAL);
                    this.GeboorteDatum = this.converteerDatumNaarNgbDate(lid.GEBOORTE_DATUM);
                    this.avatar = lid.AVATAR + "";  // voorkom dat lid.avatar undefined is. Dan kan je geen avatar uploaden
                    this.isLoading = false;

                    // saldo tonen we alleen voor onszelf, behalve als we (DDWV) beheerder zijn, dan mogen we ook ondere leden zien
                    const ui = this.loginService.userInfo?.Userinfo;
                    if (this.lid.ID == this.loginService.userInfo?.LidData?.ID) {
                        this.saldoTonen = this.configService.saldoActief() && (ui!.isDDWV! || ui!.isClubVlieger!);
                    }
                    else {
                        this.saldoTonen = this.configService.saldoActief() && ((ui?.isBeheerder || ui?.isBeheerderDDWV) ?? false);
                    }
                });
            } catch (_) {
                this.isLoading = false;
            }
        } else {
            this.titel = 'Lid aanmaken';
            this.subtitel = 'Toevoegen van een nieuw lid';

            this.MedicalDatum = null;
            this.GeboorteDatum = null;
        }
    }

    // opslaan van starts
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
        } else {
            this.lid.GEBOORTE_DATUM = undefined;
        }

        if (this.MedicalDatum != null) {
            this.lid.MEDICAL = this.converteerDatumNaarISO(this.MedicalDatum);
        } else {
            this.lid.MEDICAL = undefined;
        }

        // opbouwen van de volledige naam
        this.lid.NAAM = "";
        if (this.lid.VOORNAAM && this.lid.VOORNAAM!.length > 0) {
            this.lid.NAAM += this.lid.VOORNAAM;
        }
        if (this.lid.TUSSENVOEGSEL && this.lid.TUSSENVOEGSEL!.length > 0) {
            if (this.lid.NAAM != "") {
                this.lid.NAAM += " ";
            }
            this.lid.NAAM += this.lid.TUSSENVOEGSEL;
        }
        if (this.lid.ACHTERNAAM && this.lid.ACHTERNAAM!.length > 0) {
            if (this.lid.NAAM != "") {
                this.lid.NAAM += " ";
            }
            this.lid.NAAM += this.lid.ACHTERNAAM;
        }

        // nu opslaan van de starts
        if (this.isRestoreMode) {
            this.restore()
        } else if (this.isVerwijderMode) {
            this.delete()
        } else if (this.lid.ID != undefined && this.lid.ID >= 0) {
            this.updateLid()
        } else {
            this.nieuwLid()
        }
    }

    // markeer lid als verwijderd
    delete(): void {
        this.isSaving = true;
        this.ledenService.deleteLid(this.lidID).then(() => {
            this.isSaving = false;
            this.error = undefined;
            this.success = {titel: "Profiel", beschrijving: this.lid.NAAM + " is verwijderd"}

            setTimeout(() => this.router.navigate(['/leden']), 3000);
        }).catch(e => {
            this.isSaving = false;
            this.success = undefined;
            this.error = e;
        });
    }

    // haal een lid terug door verwijderd vlag te resetten
    restore(): void {
        this.isSaving = true;
        this.ledenService.restoreLid(this.lid.ID!).then(() => {
            this.isSaving = false;
            this.error = undefined;
            this.success = {titel: "Profiel", beschrijving: this.lid.NAAM + " is weer beschikbaar"}

            setTimeout(() => this.router.navigate(['/leden']), 3000);
        }).catch(e => {
            this.isSaving = false;
            this.success = undefined;
            this.error = e;
        });
    }

    // update bestaand lid
    updateLid(): void {
        this.isSaving = true;
        this.ledenService.updateLid(this.lid).then((l) => {
            this.isSaving = false;
            this.error = undefined;

            const ui = this.loginService.userInfo?.LidData
            if (this.lidID == ui!.ID) {
                this.success = {titel: "Profiel", beschrijving: "Uw profiel is aangepast"}
            } else {
                this.success = {titel: "Profiel", beschrijving: "Profiel " + l.NAAM + " is aangepast"}
            }
        }).catch(e => {
            this.isSaving = false;
            this.success = undefined;
            this.error = e;
        });
    }

    // nieuw lid toevoegen aan het leden bestand
    nieuwLid(): void {
        this.isSaving = true;
        this.ledenService.addLid(this.lid).then((l) => {
            this.lid = l;
            this.isSaving = false;
            this.error = undefined;
            this.success = {titel: "Profiel", beschrijving: l.NAAM + " is toegevoegd"}

            setTimeout(() => this.router.navigate(['/leden']), 3000);
        }).catch(e => {
            this.isSaving = false;
            this.success = undefined;
            this.error = e;
        });
    }

    // Datum velden moeten in YYYY-MM-DD aan api worden aangeboden
    converteerDatumNaarISO($event: NgbDate): string {
        const unformatted = DateTime.fromObject($event);
        return unformatted.isValid ? (unformatted.toISODate() as string) : '';
    }

    // Datum velden komen in ISO formaat van API, conversie naar NgbDate zodat invoer gedaan kan worden
    converteerDatumNaarNgbDate(datum: string | undefined): NgbDate | null {
        if (datum) {
            return NgbDate.from(DateTime.fromSQL(datum));
        } else
            return null;
    }

    // Laat het wachtwoorden wel / niet zien
    verbergWachtwoord() {
        this.wachtwoordVerborgen = !this.wachtwoordVerborgen;
        this.oogIcon = this.wachtwoordVerborgen ? faEye : faEyeSlash;
    }

    // Avatar is aangepast in editor, meteen avatar in het profiel aanpassen
    setAvatar($event: string) {
        this.avatar = $event;
        this.changeDetector.detectChanges();
    }


    // nu opslaan van de avatar
    uploadFoto(image: string) {
        this.setAvatar(image);
        try {
            this.imageService.uploadFoto(this.lidID, image).then(() => {
                this.success = {titel: "upload avatar", beschrijving: "Foto is succesvol opgeslagen"};
            });
        } catch (e) {
            this.success = undefined;
            this.error = e;
        }
    }

    // Voor sommige gebruikers is 2 factor authenticatie verplicht
    isgoogleAuthNodig(): boolean {
        if (this.lid.BEHEERDER || this.lid.DDWV_BEHEERDER || this.lid.INSTRUCTEUR || this.lid.CIMT ||
            this.lid.DDWV_CREW || this.lid.ROOSTER || this.lid.STARTTOREN || this.lid.RAPPORTEUR) {
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
            case 'BASIS' : {
                if (ui?.isBeheerder || ui?.isBeheerderDDWV || this.ikBenHetZelf())
                    return false;
                break;
            }
            case 'googleAuth': {
                return this.isgoogleAuthNodig();
            }
            case 'zelfstartAbonnement':
            case 'gebruiker':
            case 'lidnummer':
            case 'lidmaatschap': {
                if (ui?.isBeheerder || ui?.isBeheerderDDWV) {
                    return false;
                }
                break;
            }
            case 'STATUS': {
                if (ui?.isBeheerder || ui?.isCIMT) {
                    return false;
                }
                break;
            }
            case 'LIERIST':
            case 'STARTLEIDER':
            case 'SLEEPVLIEGER':
            case 'GASTENVLIEGER': {
                if (ui?.isBeheerder || ui?.isRooster) {
                    return false;
                }
                break;
            }
            case 'CIMT':
            case 'TECHNICUS':
            case 'STARTTOREN':
            case 'RAPPORTEUR':
            case 'ROOSTER':
            case 'BEHEERDER':
            case 'DDWV_BEHEERDER':
            case 'OPGEZEGD':
            case 'STARTVERBOD': {
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
            case 'BUDDY': {
                if (ui?.isBeheerder || ui?.isCIMT) {
                    return false;
                }
                break;
            }
            case 'OPMERKINGEN': {
                if (ui?.isBeheerder || ui?.isCIMT || ui?.isRooster) {
                    return false;
                }
                break;
            }

            default:
                console.log("Veld " + veld + " niet in switch");
        }
        return true;
    }

    // Logica om te bepalen of je veld wel/niet mag zien
    isVisible(veld: string) {
        const ui = this.loginService.userInfo?.Userinfo;

        switch (veld) {
            case 'wachtwoorden': {
                if (ui?.isBeheerder || ui?.isBeheerderDDWV || this.ikBenHetZelf()) {
                    return true;
                }
                break;
            }

            case 'email_daginfo' : {
                if (ui?.isBeheerder || ui?.isInstructeur || ui?.isCIMT) {
                    return true;
                }
                break;
            }
            case 'OPGEZEGD': {
                if (ui?.isBeheerder || this.ikBenHetZelf()) {
                    return true;
                }
                break;
            }
            case 'STARTVERBOD': {
                if (ui?.isBeheerder || this.ikBenHetZelf()) {
                    return true;
                }
                break;
            }
            case 'OPMERKINGEN': {
                if (ui?.isBeheerder || ui?.isInstructeur || ui?.isCIMT || ui?.isRooster || this.ikBenHetZelf()) {
                    return true;
                }
                break;
            }

            case 'ZELFSTART_ABONNEMENT': {
                if (ui?.isBeheerder || ui?.isBeheerderDDWV || this.ikBenHetZelf()) {
                    return true;
                }
                break;
            }
        }
        return false;
    }

    // Ben ik mijn eigen profiel aan het aanpassen?
    ikBenHetZelf(): boolean {
        return this.loginService.userInfo?.LidData?.ID == this.lidID
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
        if (this.isRestoreMode || this.isVerwijderMode) {
            return false;
        }

        if (this.lid.AUTH == false) {
            return false;
        }
        return this.lid.SECRET?.startsWith("http");     // heeft url als secret gevuld is
    }

    // Check of medical ingevoerd is, of misschien wel verlopen is.
    medicalVerlopen() {
        if (this.MedicalDatum == null) {
            return false;
        }
        const d = DateTime.fromObject({
            year: this.MedicalDatum.year,
            month: this.MedicalDatum.month,
            day: this.MedicalDatum.day
        })
        return (d < DateTime.now());
    }

    // openen van windows voor het tonen van de transacties
    toonTransacties() {
        this.transactieScherm.openPopup(this.lid!.ID!, this.ddwvService.magBestellen(this.lid.TEGOED));
    }
}
