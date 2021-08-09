import {Component, OnInit, ViewChild} from '@angular/core';
import {CdkDrag, CdkDragDrop} from '@angular/cdk/drag-drop';
import {LedenService} from '../../services/apiservice/leden.service';
import {HeliosLedenDataset, HeliosLid, HeliosRoosterDataset} from '../../types/Helios';
import {faCalendarDay, faTimesCircle, faUsers} from '@fortawesome/free-solid-svg-icons';
import {SharedService} from '../../services/shared/shared.service';
import {Subscription} from 'rxjs';
import {RoosterService} from '../../services/apiservice/rooster.service';
import {getBeginEindDatumVanMaand} from '../../utils/Utils';
import {CustomError} from '../../types/Utils';
import {DateTime} from 'luxon';
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faFilter} from "@fortawesome/free-solid-svg-icons/faFilter";
import {LedenFilterComponent} from "../../shared/components/leden-filter/leden-filter.component";


type HeliosLedenDatasetExtended = HeliosLedenDataset & {
    KEER_INGEDEELD?: number
}

@Component({
    selector: 'app-rooster-page',
    templateUrl: './rooster-page.component.html',
    styleUrls: ['./rooster-page.component.scss']
})
export class RoosterPageComponent implements OnInit {
    @ViewChild(LedenFilterComponent) ledenFilter: LedenFilterComponent;

    readonly roosterIcon = faCalendarDay;
    readonly resetIcon = faTimesCircle;

    toonStartleiders = true;
    toonInstructeurs = true;
    toonLieristen = true;
    toonDDWV = true;

    toonClubDDWV = 1;            // 0, gehele week, 1 = club dagen, 2 = alleen DDWV

    alleLeden: HeliosLedenDataset[];
    filteredLeden: HeliosLedenDatasetExtended[];
    heleRooster: HeliosRoosterDataset[];
    filteredRooster: HeliosRoosterDataset[];

    huidigJaar: number;
    huidigMaand: number;
    private datumAbonnement: Subscription;


    isLoading: boolean = false;
    zoekString: string;

    constructor(
        private readonly ledenService: LedenService,
        private readonly sharedService: SharedService,
        private readonly roosterService: RoosterService) {
    }

    ngOnInit(): void {
        this.datumAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
            this.huidigMaand = jaarMaand.month;
            this.huidigJaar = jaarMaand.year;
            this.opvragen();
        });
    }

    onDropInTable(event: CdkDragDrop<HeliosLedenDataset, any>, dagInRooster: HeliosRoosterDataset): void {
        // Haal de nieuwe en oude ID's op. Een id is bijvoorbeeld:
        // OCHTEND_LIERIST-0
        // 0 is de index in het rooster, dus de eerste dag van de maand.
        // OCHTEND_LIERIST is de taak die te vervullen is.
        const nieuwContainerId = event.container.id;
        const oudContrainerId = event.previousContainer.id;

        let naam;
        let id;
        // Als de nieuwe container hetzelfde is al de oude, doe dan niks.
        if (nieuwContainerId === oudContrainerId) {
            return;
        }
        // Als de actie van een container naar een andere container is geweest, controleren we eerst of de oude container de ledenlijst was of niet
        else if (nieuwContainerId !== oudContrainerId) {
            // De actie komt niet uit de ledenlijst, dus iemand is al ergens anders ingevuld. Die moeten we eerst leegmaken, en dan kunnen we de nieuwe vullen.
            if (oudContrainerId !== 'LEDENLIJST') {
                // We hakken de id op en halen de verschillende onderdelen eruit (taak en index van het rooster)
                const taakOnderdelen = this.getTaakEnIndexVanID(oudContrainerId);

                // We hebben van een dag naar een andere dag versleept dus data zit op een andere locatie.
                // Uit die data halen we de naam en id op die toen was gezet en zetten die op de nieuwe dag
                const data = event.item.dropContainer.data;
                naam = data[taakOnderdelen.taak];
                id = data[taakOnderdelen.taak + '_ID'];

                // En omdat we data verplaatsen, resetten vervolgens de dag waar we vandaan kwamen
                this.setTaakWaardes(this.heleRooster[taakOnderdelen.index], taakOnderdelen.taak, undefined, undefined);
            } else {
                // De oude container is wel de ledenlijst geweest, dus de data zit op deze locatie.
                const data = event.item.data;
                naam = data.NAAM;
                id = data.ID;
                // Verhoog ook het aantal keer ingedeeld van deze persoon, sorteer daarna de ledenlijst.
                data.KEER_INGEDEELD = data.KEER_INGEDEELD ? data.KEER_INGEDEELD + 1 : 1;
            }
        }
        const taak = this.getTaakEnIndexVanID(nieuwContainerId).taak;
        this.setTaakWaardes(dagInRooster, taak, id, naam);
    }

    /**
     * Haal alle informatie op
     * @private
     */
    private opvragen() {
        this.isLoading = true;
        this.ledenService.getLeden(false).then(leden => {
            this.alleLeden = leden;
            this.applyLedenFilter();
            this.isLoading = false;
        }).catch(e => this.catchError(e));

        const beginEindDatum = getBeginEindDatumVanMaand(this.huidigMaand, this.huidigJaar);
        this.roosterService.getRooster(beginEindDatum.begindatum, beginEindDatum.einddatum).then(rooster => {
            console.log(rooster);
            this.heleRooster = rooster;
            this.vulMissendeDagenAan();
            this.applyRoosterFilter();
            this.isLoading = false;
        }).catch(e => this.catchError(e));
    }

    /**
     * Vang een API error af
     * @param {CustomError} e
     * @private
     */
    private catchError(e: CustomError) {
        console.error(e);
        this.isLoading = false;
    }

    /**
     * Het opgehaalde rooster kan dagen in de maand missen. Deze functie vult alle data aan zodat elke dag in de maand getoond wordt.
     * @private
     * @return {void}
     */
    private vulMissendeDagenAan(): void {
        const dagenInDeMaand = DateTime.fromObject({year: this.huidigJaar, month: this.huidigMaand}).daysInMonth;
        for (let i = 0; i < dagenInDeMaand; i++) {
            const datumInRooster = DateTime.fromISO((this.heleRooster[i]?.DATUM || ''));
            const nieuwDagInRooster: HeliosRoosterDataset = {
                DATUM: DateTime.fromObject({month: this.huidigMaand, year: this.huidigJaar, day: i + 1}).toISODate()
            };

            if (datumInRooster.isValid) {
                const dag = datumInRooster.day;
                if (dag > i + 1) {
                    this.heleRooster.splice(i, 0, nieuwDagInRooster);
                }
            } else {
                this.heleRooster.splice(i, 0, nieuwDagInRooster);
            }
        }
    }

    /**
     * Wordt in de template gebruikt om te controleren of iemand in een vakje gesleept mag worden. Gaat over lierist.
     * @param {CdkDrag<HeliosLid | HeliosRoosterDataset>} item
     * @return {boolean}
     */
    lieristEvaluatie(item: CdkDrag<HeliosLid | HeliosRoosterDataset>): boolean {
        return this.controleerRol(item, 'LIERIST');
    }

    /**
     * Wordt in de template gebruikt om te controleren of iemand in een vakje gesleept mag worden. Gaat over instructeurs.
     * @param {CdkDrag<HeliosLid | HeliosRoosterDataset>} item
     * @return {boolean}
     */
    instructeurEvaluatie(item: CdkDrag<HeliosLid | HeliosRoosterDataset>): boolean {
        return this.controleerRol(item, 'INSTRUCTEUR');
    }

    /**
     * Wordt in de template gebruikt om te controleren of iemand in een vakje gesleept mag worden. Gaat over startleiders.
     * @param {CdkDrag<HeliosLid | HeliosRoosterDataset>} item
     * @return {boolean}
     */
    startleiderEvaluatie(item: CdkDrag<HeliosLid | HeliosRoosterDataset>): boolean {
        return this.controleerRol(item, 'STARTLEIDER');
    }

    /**
     * Deze functie evalueert of de content een bepaalde rol is. Als dat zo is, returned hij true, anders false.
     * Als de meegegeven rol bijv. LIERIST is, kan een instructeur bijv. geen lieristdienst draaien.
     */
    controleerRol(item: CdkDrag<HeliosLid | HeliosRoosterDataset>, rol: 'LIERIST' | 'INSTRUCTEUR' | 'STARTLEIDER'): boolean {
        // Content komt uit de ledenlijst of niet
        if (item.dropContainer.id === 'LEDENLIJST') {
            const data = item.data;
            return data[rol];
        } else {
            const data = item.dropContainer.data;
            const taak = this.getTaakEnIndexVanID(item.dropContainer.id).taak;
            const id = data[taak + '_ID'];
            // We moeten in alle leden zoeken, omdat de leden-filter criteria veranderd kan zijn, waardoor een lid niet gevonden wordt.
            const lid = this.alleLeden.find(lid => lid.ID === id);
            return lid ? (lid[rol] || false) : false;
        }
    }

    onDropInLedenlijst(event: CdkDragDrop<HeliosLedenDataset[], any>): void {
        // De nieuwe container is hetzelfde als de vorige, doe dan niks.
        if (event.container === event.previousContainer) {
            return;
        } else {
            const data = event.item.dropContainer.data;
            const roosterDag = this.heleRooster.find(dag => dag.DATUM === data.DATUM);
            const taak = this.getTaakEnIndexVanID(event.item.dropContainer.id).taak;

            if (roosterDag) {
                this.setTaakWaardes(roosterDag, taak, undefined, undefined);
            }
        }
    }

    /**
     * Deel iemand in op een taak op een bepaalde dag
     * @param {HeliosRoosterDataset} roosterdag
     * @param {string} taak
     * @param {string | undefined} id
     * @param {string | undefined} naam
     * @return {void}
     */
    setTaakWaardes(roosterdag: HeliosRoosterDataset, taak: string, id: string | undefined, naam: string | undefined): void {
        roosterdag[taak] = naam;
        roosterdag[taak + '_ID'] = id;
    }

    /**
     * Hak een id op om de informatie in de ID te gebruiken
     * Een id is bijvoorbeeld:
     * OCHTEND_LIERIST-0
     * 0 is de index in de rooster array, 0 is dus de 1e dag van de maand.
     * OCHTEND_LIERIST is de taak
     * @param {string} id
     * @return {{taak: string, index: number}}
     */
    getTaakEnIndexVanID(id: string): { taak: string, index: number } {
        const taakEnIndex = id.split('-');
        return {
            taak: taakEnIndex[0],
            index: parseInt(taakEnIndex[1])
        };
    }

    // Open van het leden-filter dialoog
    filterPopup() {
        this.ledenFilter.openPopup();
    }

    // Er is een aanpassing gemaakt in het leden-filter dialoog. We filteren de volledige dataset tot wat nodig is
    // We hoeven dus niet terug naar de server om data opnieuw op te halen (minder data verkeer)
    applyLedenFilter() {
        let toonAlles: boolean = false;

        this.toonStartleiders = false;
        this.toonInstructeurs = false;
        this.toonLieristen = false;
        this.toonDDWV = false;

        // als er geen filters zijn, dan tonen we alles
        if (!this.sharedService.ledenlijstFilter.startleiders &&
            !this.sharedService.ledenlijstFilter.lieristen &&
            !this.sharedService.ledenlijstFilter.instructeurs &&
            !this.sharedService.ledenlijstFilter.crew) {
            toonAlles = true;
        }

        if (toonAlles) {
            this.toonStartleiders = true;
            this.toonInstructeurs = true;
            this.toonLieristen = true;
        } else {      // aha, er zijn wel filters gezet
            if (this.sharedService.ledenlijstFilter.startleiders) {
                this.toonStartleiders = true;
            }
            if (this.sharedService.ledenlijstFilter.instructeurs) {
                this.toonInstructeurs = true;
            }
            if (this.sharedService.ledenlijstFilter.lieristen) {
                this.toonLieristen = true;
            }
            if (this.sharedService.ledenlijstFilter.crew) {
                this.toonDDWV = true;
            }
        }

        // leden-filter de dataset naar de lijst
        this.filteredLeden = [];
        for (let i = 0; i < this.alleLeden.length; i++) {

            // 601 = Erelid
            // 602 = Lid
            // 603 = Jeugdlid
            let isLid = false;
            if ((this.alleLeden[i].LIDTYPE_ID == 601) ||
                (this.alleLeden[i].LIDTYPE_ID == 602) ||
                (this.alleLeden[i].LIDTYPE_ID == 603)) {
                isLid = true;
            }

            let tonen = false;
            if (isLid && toonAlles) {
                if (this.alleLeden[i].INSTRUCTEUR == true || this.alleLeden[i].STARTLEIDER == true || this.alleLeden[i].LIERIST == true) {
                    tonen = true;
                }
            } else if (this.sharedService.ledenlijstFilter.startleiders && this.alleLeden[i].STARTLEIDER == true) {
                tonen = true;
            } else if (this.sharedService.ledenlijstFilter.lieristen && this.alleLeden[i].LIERIST == true) {
                tonen = true;
            } else if (this.sharedService.ledenlijstFilter.instructeurs && this.alleLeden[i].INSTRUCTEUR == true) {
                tonen = true;
            } else if (this.sharedService.ledenlijstFilter.crew && this.alleLeden[i].DDWV_CREW == true) {
                tonen = true;
            }

            if (tonen) {
                // moeten we zoeken naar een lid ?
                if (this.zoekString && this.zoekString != "") {
                    const naamStr = this.alleLeden[i].NAAM?.toLowerCase();
                    if (!naamStr!.includes(this.zoekString.toLowerCase()))
                        continue;
                }
                this.filteredLeden.push(this.alleLeden[i]);
            }
        }
    }

    // Laat hele rooster zien, of alleen weekend / DDWV
    applyRoosterFilter() {
        // leden-filter de dataset naar de lijst
        this.filteredRooster = [];

        // toonClubDDWV, 0 = laat alle dagen zien
        if (this.toonClubDDWV == 0) {
            this.filteredRooster = this.heleRooster;
            return;
        }

        console.log("------------" + this.toonClubDDWV)
        for (let i = 0; i < this.heleRooster.length; i++) {
            const dt: DateTime = DateTime.fromSQL(this.heleRooster[i].DATUM as string);

            switch (this.toonClubDDWV) {
                case 1: // toonClubDDWV, 1 = toon clubdagen
                {
                    if (this.heleRooster[i].CLUB_BEDRIJF || dt.weekday > 5) {
                        this.filteredRooster.push(this.heleRooster[i]);
                        continue;
                    }
                    break;
                }
                case 2: // toonClubDDWV, 2 = toon DDWV
                    if (this.heleRooster[i].DDWV || dt.weekday <= 5) {
                        this.filteredRooster.push(this.heleRooster[i]);
                        continue;
                    }
                    break;
            }
        }
    }

    KolomBreedte() {
        if (this.toonDDWV) {
            return 'width: 50%'
        }

        let columns = 2;    // dag + opmerkingen
        if (this.toonInstructeurs) {
            columns += 2;
        }
        if (this.toonStartleiders) {
            columns++;
        }
        if (this.toonLieristen) {
            columns += 2;
        }
        const breedte = 100 / columns;
        return 'width:' + breedte + '%';
    }

    ToggleWeekendDDWV() {
        this.toonClubDDWV = ++this.toonClubDDWV % 3;
        this.applyRoosterFilter();
    }

    DagVanDeWeek(dag: string): string {
        const dt: DateTime = DateTime.fromSQL(dag as string);

        switch (dt.weekday)
        {
            case 1: return "Maandag";
            case 2: return "Dinsdag";
            case 3: return "Woensdag";
            case 4: return "Donderdag";
            case 5: return "Vrijdag";
            case 6: return "Zaterdag";
            case 7: return "Zondag";
        }
        return "??";
    }
}
