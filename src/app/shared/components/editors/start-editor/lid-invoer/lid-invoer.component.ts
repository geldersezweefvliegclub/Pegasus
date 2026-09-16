import { Component, Input, OnChanges, OnInit, SimpleChanges, input, output } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { HeliosAanwezigLedenDataset, HeliosLedenDataset, HeliosVliegtuigenDataset } from '../../../../../types/Helios';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { AsyncPipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-lid-invoer',
    templateUrl: './lid-invoer.component.html',
    styleUrls: ['./lid-invoer.component.scss'],
    imports: [FaIconComponent, NgbPopover, NgSelectComponent, FormsModule, AsyncPipe]
})
export class LidInvoerComponent implements OnInit, OnChanges {
    readonly leden = input<HeliosLedenDataset[]>([]);
    readonly aanwezig = input<HeliosAanwezigLedenDataset[]>([]);
    readonly placeholder = input("");
    @Input() label = "";
    @Input() uitleg: string;
    readonly disabled = input(false);
    readonly required = input(false);
    readonly veldID = input<number>();
    readonly excludeLidTypes = input("");
    readonly alleenPaxVliegers = input(false);
    readonly alleenInstructeurs = input(false);
    @Input() LID_ID: number | undefined;
    readonly vliegtuig = input<HeliosVliegtuigenDataset>();

    readonly LidChanged = output<number | undefined>();
    EventEmitterDelay: number;

    readonly infoIcon: IconDefinition = faInfoCircle;

    lidInput$ = new Subject<string | null>();
    ledenFiltered: HeliosAanwezigLedenDataset[] = [];
    aanwezigFiltered: HeliosAanwezigLedenDataset[] = [];
    ledenSelectie$: Observable<HeliosAanwezigLedenDataset[]>;

    InputChangeEventFired = false;

    ngOnInit(): void {
        this.lidInput$.subscribe((newTerm) => {
            const nweLijst = this.zoekLid(newTerm);

            this.ledenSelectie$ = of(nweLijst);

            if (newTerm && nweLijst.length > 0) {
                this.LID_ID = nweLijst[0].LID_ID;
                this.inputChange(this.LID_ID);
            }
        });
    }

    // zoek naar records die overeenkomen met input
    // als geen leden aanwezig zijn, dan gebruiken we de volledige ledenlijst
    private zoekLid(term: string | null): HeliosAanwezigLedenDataset[] {
        const searchTerm = term ? term : '';

        // bekijk of aanwezige leden voldoen
        const nweLijst = this.aanwezigFiltered.filter((lid: HeliosAanwezigLedenDataset) => {
            return lid.NAAM!.toLowerCase().includes(searchTerm.toLowerCase());
        });

        if ((nweLijst.length > 0) && ((nweLijst.length >= 5) || (searchTerm.length <= 2))) {
            return nweLijst
        }

        // nee, geen aanwezige leden, dan alle leden
        return this.ledenFiltered.filter((lid: HeliosAanwezigLedenDataset) => {
            return lid.NAAM!.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }

    ngOnChanges(_: SimpleChanges) {
        // leden komen in ander formaat, dus even goed zetten
        this.ledenFiltered = [];
        const leden = this.leden();
        if (leden) {
            leden.forEach(item => {
                const excludeLidTypes = this.excludeLidTypes();
                if (excludeLidTypes) {
                    if (excludeLidTypes.includes(item.LIDTYPE_ID!.toString())) {
                        return;    // we moeten dit lid niet opnemen omdat lidtype niet voldoet
                    }
                }
                if ((this.alleenPaxVliegers()) && (item.PAX !== true)) {
                    return;    // We zoeken alleen leden die PAX mogenvliegen
                }
                if ((this.alleenInstructeurs()) && (item.INSTRUCTEUR !== true)) {
                    return;    // We zoeken alleen leden die instructeur zijn
                }
                this.ledenFiltered.push(
                    {
                        LID_ID: item.ID,
                        NAAM: item.NAAM,
                        LIDTYPE_ID: item.LIDTYPE_ID,
                        VOORKEUR_VLIEGTUIG_TYPE: "",
                        OVERLAND_VLIEGTUIG_ID: -1
                    });
            });
        }

        this.aanwezigFiltered = this.aanwezig().filter((lid: HeliosAanwezigLedenDataset) => {
            if (!lid.INSTRUCTEUR && this.alleenInstructeurs()) return false;
            if (lid.LID_ID == this.LID_ID) return true;  // reeds invoerde lid moet ook in de lijst

            // We laten alleen vlieger zien die zich voor dit veld hebben aangemeld. Handig voor kampen als er
            // op twee velden gevlogen wordt.
            const veldID = this.veldID();
            if (veldID) {
                if ((lid.VELD_ID != veldID) && (lid.VELD_ID != undefined)) {
                    return false;       // niet op dit vliegveld, dus niet in de default lijst
                }
            }

            const excludeLidTypes = this.excludeLidTypes();
            if (excludeLidTypes) {
                return (!excludeLidTypes.includes(lid.LIDTYPE_ID!.toString()))
            }
            return true;
        });

        // Als we zojuist input hebben gedaan, dan staat InputChangeEventFired op true. We hoeven dan onderstaande code niet uit te voeren
        // Dat doen we alleen als Input() variable aangepast is
        if (this.InputChangeEventFired) {
            return;
        }

        // default lijst bevat leden die graag op dit vliegtuig willen vliegen
        // wordt aangeven via vliegtuig type of vliegtuig id
        const defaultLijst = this.aanwezigFiltered.filter((lid: HeliosAanwezigLedenDataset) => {
            if (lid.LID_ID == this.LID_ID) return true;     // reeds invoerde lid moet ook in de lijst

            const vliegtuig = this.vliegtuig();
            if ((vliegtuig?.TYPE_ID) && (lid.VOORKEUR_VLIEGTUIG_TYPE) &&
                (lid.VOORKEUR_VLIEGTUIG_TYPE.includes(vliegtuig.TYPE_ID.toString())))
                return true;
            return (lid.OVERLAND_VLIEGTUIG_ID == vliegtuig?.ID)
        });

        const inDefault = defaultLijst.findIndex(lid => lid.LID_ID == this.LID_ID) >= 0;                // bevat defaultLijst de vlieger, boolean true/false
        const inAanwezig = this.aanwezigFiltered.findIndex(lid => lid.LID_ID == this.LID_ID) >= 0;      // bevat aanwezigLijst de vlieger, boolean true/false
        const inLeden = this.ledenFiltered.findIndex(lid => lid.LID_ID == this.LID_ID) >= 0;            // bevat ledenLijst de vlieger, boolean true/false
        // niet alle leden staan in aanwezig (denk aan zusterclubs), voor edit moeten we goede lijst kiezen
        if (inDefault) {
            this.ledenSelectie$ = of(defaultLijst);           // leden die graag op dit vliegtuig vliegen
        } else if (inAanwezig) {
            this.ledenSelectie$ = of(this.aanwezigFiltered);  // alle aanwezig leden
        } else if (inLeden) {
            this.ledenSelectie$ = of(this.ledenFiltered);     // complete ledenlijst
        } else if (defaultLijst.length > 0) {
            this.ledenSelectie$ = of(defaultLijst);           // leden die graag op dit vliegtuig vliegen
        } else if (this.aanwezig().length > 0) {
            this.ledenSelectie$ = of(this.aanwezigFiltered);  // alle aanwezig leden
        } else {
            this.ledenSelectie$ = of(this.ledenFiltered);     // complete ledenlijst
        }
    }

    inputChange(id: number | undefined) {
        clearTimeout(this.EventEmitterDelay);
        this.EventEmitterDelay = window.setTimeout(() => {

            this.InputChangeEventFired = true;  // laat weten dat we event gaan afvuren
            setTimeout(() => this.InputChangeEventFired = false, 100); // en reset na 100 ms
            this.LidChanged.emit(id);
        }, 500);
    }
}
