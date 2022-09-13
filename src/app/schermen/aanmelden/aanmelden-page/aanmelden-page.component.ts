import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faStreetView} from "@fortawesome/free-solid-svg-icons";
import {Subscription} from "rxjs";
import {SchermGrootte, SharedService} from "../../../services/shared/shared.service";
import {getBeginEindDatumVanMaand} from "../../../utils/Utils";
import {DateTime} from "luxon";
import {HeliosAanwezigLedenDataset, HeliosRoosterDataset, HeliosType} from "../../../types/Helios";
import {RoosterService} from "../../../services/apiservice/rooster.service";
import {ModalComponent} from "../../../shared/components/modal/modal.component";
import {LidAanwezigEditorComponent} from "../../../shared/components/editors/lid-aanwezig-editor/lid-aanwezig-editor.component";
import {LoginService} from "../../../services/apiservice/login.service";
import {AanwezigLedenService} from "../../../services/apiservice/aanwezig-leden.service";

@Component({
    selector: 'app-aanmelden-page',
    templateUrl: './aanmelden-page.component.html',
    styleUrls: ['./aanmelden-page.component.scss']
})
export class AanmeldenPageComponent implements OnInit, OnDestroy {
    @ViewChild(ModalComponent) private bevestigAfmeldenPopup: ModalComponent;
    @ViewChild(LidAanwezigEditorComponent) aanmeldEditor: LidAanwezigEditorComponent;

    readonly aanmeldenIcon: IconDefinition = faStreetView;

    private aanwezigLedenAbonnement: Subscription;  // Wie zijn er op welke dag aanwezig
    private resizeSubscription: Subscription;       // Abonneer op aanpassing van window grootte (of draaien mobiel)
    private maandAbonnement: Subscription;          // volg de keuze van de kalender
    private datumAbonnement: Subscription;          // volg de keuze van de kalender
    datum: DateTime = DateTime.now();               // de gekozen dag
    maandag: DateTime                               // de eerste dag van de week

    afmeldDatumDMY: string;                         // De datum waarop we ons afmelden
    afmeldDatum: DateTime;

    ophalenOverslaan = false;                       // Voorkom dat er te veel tegelijk wordt opgevraagd
    isLoading: boolean = false;
    aanmeldenView: string = "week";
    rooster: HeliosRoosterDataset[];                // rooster voor gekozen periode (dag/week/maand)
    aanmeldingen: HeliosAanwezigLedenDataset[];     // De aanmeldingen

    constructor(private readonly sharedService: SharedService,
                private readonly loginService: LoginService,
                private readonly roosterService: RoosterService,
                private readonly aanwezigLedenService: AanwezigLedenService) {
    }

    ngOnInit(): void {

        // de datum zoals die in de kalender gekozen is
        this.maandAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
            if (jaarMaand.year > 1900) {        // 1900 is bij initialisatie
                this.zetDatum(DateTime.fromObject({
                    year: jaarMaand.year,
                    month: jaarMaand.month,
                    day: 1,
                }));
                this.opvragen();
            }
        })

        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            this.zetDatum(DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: datum.day,
            }))
            this.opvragen();
        });

        // abonneer op wijziging van aanwezige leden
        this.aanwezigLedenAbonnement = this.aanwezigLedenService.aanwezigChange.subscribe(dataset => {
            this.opvragen();    // kunnen dataset niet gebruiken omdat we hier ander tijdspanne gebruiken
        });

        // Roep onWindowResize aan zodra we het event ontvangen hebben
        this.resizeSubscription = this.sharedService.onResize$.subscribe(size => {
            this.onWindowResize();
            this.opvragen();
        });
    }

    ngOnDestroy(): void {
        if (this.datumAbonnement) this.datumAbonnement.unsubscribe();
        if (this.maandAbonnement) this.maandAbonnement.unsubscribe();
        if (this.resizeSubscription) this.resizeSubscription.unsubscribe();
    }

    onWindowResize() {
        if (this.sharedService.getSchermSize() <= SchermGrootte.sm) {
            this.aanmeldenView = "dag"
        } else {
            this.aanmeldenView = "week"
        }
    }

    private opvragen(): void {
        const beginEindDatum = getBeginEindDatumVanMaand(this.datum.month, this.datum.year);

        let beginDatum: DateTime = beginEindDatum.begindatum;
        let eindDatum: DateTime = beginEindDatum.einddatum;

        if (this.ophalenOverslaan) {
            return;                         // twee verzoek om data op t evragen binnen 2 seconden
        }

        this.ophalenOverslaan = true;
        setTimeout(() => this.ophalenOverslaan = false, 2000);

        switch (this.aanmeldenView) {
            case "dag" : {
                beginDatum = this.datum;
                eindDatum = this.datum;
                break;
            }
            case "week": {
                beginDatum = this.datum.startOf('week');     // maandag in de 1e week vande maand, kan in de vorige maand vallen
                eindDatum = this.datum.endOf('week');        // zondag van de laaste week, kan in de volgende maand vallen
                break;
            }
        }

        this.isLoading = true;
        this.roosterService.getRooster(beginDatum, eindDatum).then((rooster) => {
            this.rooster = rooster;
            this.isLoading = false;
        }).catch(() => this.isLoading = false)

        this.aanwezigLedenService.getAanwezig(beginDatum, eindDatum).then((aanmeldingen) => {
            this.aanmeldingen = aanmeldingen;
            this.isLoading = false;
        }).catch(() => this.isLoading = false)

    }

    // We gaan naar een nieuwe datum
    zetDatum(nieuweDatum: DateTime) {
        this.datum = nieuweDatum;
        this.maandag = this.datum.startOf('week'); // de eerste dag van de gekozen week
        this.opvragen();
    }

    // toon popup dat de gebruiker zich wil afmelden voor de vliegdag
    afmeldenPopup(datum: string) {
        const d = datum.split('-');
        this.afmeldDatumDMY = d[2] + '-' + d[1] + '-' + d[0];
        this.afmeldDatum = DateTime.fromSQL(datum);

        this.bevestigAfmeldenPopup.open();
    }

    // afmelding doorvoeren bij Helios
    afmelden() {
        this.aanwezigLedenService.getAanwezig(this.afmeldDatum, this.afmeldDatum).then((a) => {
            const aanmeldingen = a!.filter((al:HeliosAanwezigLedenDataset) => { return al.LID_ID == this.loginService.userInfo!.LidData!.ID})

            for (let i=0 ; i < aanmeldingen.length ; i++)  {
                if (aanmeldingen[i].DATUM == DateTime.now().toISODate()  && aanmeldingen[i].AANKOMST) {
                    this.aanwezigLedenService.afmelden(aanmeldingen[i].LID_ID!).then(() => this.opvragen());
                }
                else {
                    this.aanwezigLedenService.aanmeldingVerwijderen(aanmeldingen[i].ID!).then(() => this.opvragen());
                }
            }
            this.isLoading = false;
            this.bevestigAfmeldenPopup.close();
        }).catch(() => this.isLoading = false)
    }

    // openen van windows voor aanmelden vlieger
    aanmeldenLidScherm(datum: string) {
        const lidData = this.loginService.userInfo!.LidData!
        const aanmelding: HeliosAanwezigLedenDataset = {
            LID_ID: lidData.ID!,
            NAAM: lidData.NAAM!,
            DATUM: datum,
            VOORAANMELDING: true
        }
        this.aanmeldEditor.openPopup(aanmelding);
    }
}
