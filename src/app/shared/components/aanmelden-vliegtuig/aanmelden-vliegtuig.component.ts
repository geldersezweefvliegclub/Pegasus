import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {HeliosAanwezigVliegtuigenDataset, HeliosVliegtuigenDataset} from "../../../types/Helios";
import {ModalComponent} from "../modal/modal.component";
import {Subscription} from "rxjs";
import {VliegtuigenService} from "../../../services/apiservice/vliegtuigen.service";
import {AanwezigVliegtuigService} from "../../../services/apiservice/aanwezig-vliegtuig.service";
import {DateTime} from "luxon";
import {SharedService} from "../../../services/shared/shared.service";
import {ErrorMessage, SuccessMessage} from "../../../types/Utils";
import {DaginfoService} from "../../../services/apiservice/daginfo.service";


@Component({
    selector: 'app-aanmelden-vliegtuig',
    templateUrl: './aanmelden-vliegtuig.component.html',
    styleUrls: ['./aanmelden-vliegtuig.component.scss']
})
export class AanmeldenVliegtuigComponent implements OnInit, OnDestroy {
    @ViewChild(ModalComponent) private popup: ModalComponent;
    @Input() vliegveld: number | undefined;

    private datumAbonnement: Subscription; // volg de keuze van de kalender
    datum: DateTime = DateTime.now();      // de gekozen dag in de kalender

    private vliegtuigenAbonnement: Subscription;
    vliegtuigen: HeliosVliegtuigenDataset[] = [];
    filteredVliegtuigen: HeliosVliegtuigenDataset[] = [];

    private aanwezigVliegtuigenAbonnement: Subscription;
    aanwezigVliegtuigen: HeliosAanwezigVliegtuigenDataset[] = [];
    filteredAanwezigVliegtuigen: HeliosAanwezigVliegtuigenDataset[] = [];

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    zoekString: string;
    bezig: boolean = false;
    bezigTimer: number;

    constructor(private readonly sharedService: SharedService,
                private readonly daginfoService: DaginfoService,
                private readonly vliegtuigenService: VliegtuigenService,
                private readonly aanwezigVliegtuigenService: AanwezigVliegtuigService) {
    }

    ngOnInit(): void {
        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            this.datum = DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: datum.day
            })
        });

        // abonneer op wijziging van vliegtuigen
        this.vliegtuigenAbonnement = this.vliegtuigenService.vliegtuigenChange.subscribe(vliegtuigen => {
            this.vliegtuigen = (vliegtuigen) ? vliegtuigen : [];
            this.filterVliegtuigen();
        });

        // abonneer op wijziging van aanwezige vliegtuigen
        this.aanwezigVliegtuigenAbonnement = this.aanwezigVliegtuigenService.aanwezigChange.subscribe(dataset => {
            // Als er starts is, even in juiste formaat zetten. Aanwezig moet hetzelfde formaat hebben als vliegtuigen
            this.aanwezigVliegtuigen = (dataset) ? dataset : [];
            this.filterVliegtuigen();

            this.bezig = false;
            clearTimeout(this.bezigTimer);
        });
    }

    ngOnDestroy() {
        if (this.datumAbonnement) this.datumAbonnement.unsubscribe();
        if (this.vliegtuigenAbonnement) this.vliegtuigenAbonnement.unsubscribe();
        if (this.aanwezigVliegtuigenAbonnement) this.aanwezigVliegtuigenAbonnement.unsubscribe();
    }

    openPopup() {
        this.popup.open();
    }

    // toon geen vliegtuigen die al aangemeld zijn
    filterVliegtuigen() {
        if (!this.vliegtuigen) {                       // er is niets te filteren
            this.filteredVliegtuigen = [];
            return;
        }

        if (!this.aanwezigVliegtuigen) {              // er is niets te filteren
            this.filteredVliegtuigen = this.vliegtuigen;
            this.filteredAanwezigVliegtuigen = [];
            return;
        }

        this.filteredVliegtuigen = this.vliegtuigen.filter((v: HeliosVliegtuigenDataset) => {
            if (this.aanwezigVliegtuigen.findIndex(a => a.VLIEGTUIG_ID == v.ID) < 0)
                return true;
        });

        if (this.zoekString && this.zoekString.length > 0) {
            this.filteredVliegtuigen = this.filteredVliegtuigen.filter((av) => (av.REG_CALL?.toLowerCase().includes(this.zoekString.toLowerCase())))
            this.filteredAanwezigVliegtuigen = this.aanwezigVliegtuigen.filter((av) => (av.REG_CALL?.toLowerCase().includes(this.zoekString.toLowerCase())));
        } else {
            this.filteredAanwezigVliegtuigen = this.aanwezigVliegtuigen;
        }
    }

    aanmelden(geslecteerdVliegtuig: HeliosVliegtuigenDataset) {
        this.bezig = true;

        // aanmelden op een vliegveld. Via filter of daginfo
        let vliegveld = this.vliegveld;
        if (!vliegveld) {
            vliegveld = this.daginfoService.dagInfo.VELD_ID
        }

        this.aanwezigVliegtuigenService.aanmelden(this.datum, geslecteerdVliegtuig!.ID!, vliegveld).then((a) => {
            if (a.VLIEGTUIG_ID == geslecteerdVliegtuig?.ID) {
                this.success = {titel: "Aanmelden", beschrijving: "Vliegtuig is aangemeld"}
                this.aanwezigVliegtuigenService.updateAanwezigCache();
            }
        }).catch(e => {
            this.error = e;
        });

        // na 5 seconden bezit boolean uitzetten. Als getObjects event eerder is, wordt het via het abbonement uitgezet
        this.bezigTimer = window.setTimeout(() => this.bezig = false, 5000);
    }

    afmelden(geselecteerdAanwezig: HeliosAanwezigVliegtuigenDataset) {
        this.bezig = true;

        if (geselecteerdAanwezig?.AANKOMST) {
            const d = DateTime.fromSQL(geselecteerdAanwezig?.AANKOMST)

            if (d.diffNow("minute").minutes > -10) {
                this.aanwezigVliegtuigenService.aanmeldingVerwijderen(geselecteerdAanwezig!.ID!).then(() => {
                    this.success = {titel: "Afmelden", beschrijving: "Vliegtuig aanmelding is verwijderd"}
                }).catch(e => {
                    this.error = e;
                });
            } else {
                this.aanwezigVliegtuigenService.afmelden(geselecteerdAanwezig!.VLIEGTUIG_ID!).then((a) => {
                    if (a.VLIEGTUIG_ID == geselecteerdAanwezig?.VLIEGTUIG_ID) {
                        this.success = {titel: "Afmelden", beschrijving: "vliegtuig is afgemeld"}
                        this.aanwezigVliegtuigenService.updateAanwezigCache();
                    }
                }).catch(e => {
                    this.error = e;
                });
            }

            // na 5 seconden bezit boolean uitzetten. Als getObjects event eerder is, wordt het via het abbonement uitgezet
            this.bezigTimer = window.setTimeout(() => this.bezig = false, 5000);
        }
    }
}
