import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Observable, of, Subject} from 'rxjs';
import {HeliosAanwezigLedenDataset, HeliosLedenDataset, HeliosVliegtuigenDataset} from '../../../../../types/Helios';
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faInfoCircle} from "@fortawesome/free-solid-svg-icons";

@Component({
    selector: 'app-lid-invoer',
    templateUrl: './lid-invoer.component.html',
    styleUrls: ['./lid-invoer.component.scss']
})
export class LidInvoerComponent implements OnInit, OnChanges {
    @Input() leden: HeliosLedenDataset[] = [];
    @Input() aanwezig: HeliosAanwezigLedenDataset[] = [];
    @Input() placeholder: string = "";
    @Input() label: string = "";
    @Input() uitleg: string;
    @Input() disabled: boolean = false;
    @Input() required: boolean = false;
    @Input() excludeLidTypes: string = ""
    @Input() alleenPaxVliegers: boolean = false;
    @Input() alleenInstructeurs: boolean = false;
    @Input() LID_ID: number | undefined;
    @Input() vliegtuig: HeliosVliegtuigenDataset | undefined = undefined

    @Output() LidChanged: EventEmitter<number> = new EventEmitter<number>();
    EventEmitterDelay: number;

    readonly infoIcon: IconDefinition = faInfoCircle;

    lidInput$ = new Subject<string | null>();
    ledenFiltered: HeliosAanwezigLedenDataset[] = [];
    aanwezigFiltered: HeliosAanwezigLedenDataset[] = [];
    ledenSelectie$: Observable<HeliosAanwezigLedenDataset[]>;

    InputChangeEventFired: boolean = false;

    constructor() {
    }

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

    ngOnChanges(changes: SimpleChanges) {
        // leden komen in ander formaat, dus even goed zetten
        this.ledenFiltered = [];
        this.leden.forEach(item => {
            if (this.excludeLidTypes) {
                if (this.excludeLidTypes.includes(item.LIDTYPE_ID!.toString())) {
                    return;    // we moeten dit lid niet opnemen omdat lidtype niet voldoet
                }
            }
            if ((this.alleenPaxVliegers) && (item.PAX !== true)) {
                return;    // We zoeken alleen leden die PAX mogenvliegen
            }
            if ((this.alleenInstructeurs) && (item.INSTRUCTEUR !== true)) {
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

        if (!this.excludeLidTypes) {
            this.aanwezigFiltered = this.aanwezig;
        } else {
            this.aanwezigFiltered = this.aanwezig.filter((lid: HeliosAanwezigLedenDataset) => {
                if (!lid.INSTRUCTEUR && this.alleenInstructeurs) return false;
                if (lid.LID_ID == this.LID_ID) return true;  // reeds invoerde lid moet ook in de lijst
                return (!this.excludeLidTypes.includes(lid.LIDTYPE_ID!.toString()))
            });
        }

        // Als we zojuist input hebben gedaan, dan staat InputChangeEventFired op true. We hoeven dan onderstaande code niet uit te voeren
        // Dat doen we alleen als Input() variable aangepast is
        if (this.InputChangeEventFired) {
            return;
        }

        // default lijst bevat leden die graag op dit vliegtuig willen vliegen
        // wordt aangeven via vliegtuig type of vliegtuig id
        const defaultLijst = this.aanwezigFiltered.filter((lid: HeliosAanwezigLedenDataset) => {
            if (lid.LID_ID == this.LID_ID) return true;     // reeds invoerde lid moet ook in de lijst
            if ((this.vliegtuig?.TYPE_ID) && (lid.VOORKEUR_VLIEGTUIG_TYPE) &&
                (lid.VOORKEUR_VLIEGTUIG_TYPE.includes(this.vliegtuig.TYPE_ID.toString())))
                return true;
            return (lid.OVERLAND_VLIEGTUIG_ID == this.vliegtuig?.ID)
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
        } else if (this.aanwezig.length > 0) {
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
