import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {
    faAddressCard,
    faBookmark,
    faCalendarAlt,
    faChartLine,
    faChartPie,
    faClipboardList,
    faExternalLinkSquareAlt,
    faPlane,
    faTachometerAlt,
} from "@fortawesome/free-solid-svg-icons";
import {LoginService} from "../../../services/apiservice/login.service";
import {HeliosLid, HeliosLogboekDataset, HeliosType} from "../../../types/Helios";
import {ActivatedRoute, Router} from "@angular/router";
import {LedenService} from "../../../services/apiservice/leden.service";
import {TypesService} from "../../../services/apiservice/types.service";
import {faAvianex} from "@fortawesome/free-brands-svg-icons";
import {ModalComponent} from "../../../shared/components/modal/modal.component";
import {Subscription} from "rxjs";
import {DateTime} from "luxon";
import {SharedService} from "../../../services/shared/shared.service";
import * as xlsx from "xlsx";
import {StartlijstService} from "../../../services/apiservice/startlijst.service";
import {ProgressieService} from "../../../services/apiservice/progressie.service";
import {ErrorMessage, SuccessMessage} from "../../../types/Utils";
import {StartEditorComponent} from "../../../shared/components/editors/start-editor/start-editor.component";
import {TracksService} from "../../../services/apiservice/tracks.service";
import {
    AlignmentType,
    Document,
    Footer,
    Header,
    HeadingLevel, ImageRun,
    NumberFormat,
    Packer,
    PageNumber,
    Paragraph,
    TextRun,
    UnderlineType
} from 'docx';
import {saveAs} from "file-saver";
import {PegasusConfigService} from "../../../services/shared/pegasus-config.service";
import {TransactiesComponent} from "../../../shared/components/transacties/transacties.component";
import {DdwvService} from "../../../services/apiservice/ddwv.service";

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard-page.component.html',
    styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent implements OnInit, OnDestroy {
    readonly iconCardIcon: IconDefinition = faChartPie;
    readonly iconProgressie: IconDefinition = faChartLine;
    readonly iconLogboek: IconDefinition = faClipboardList;
    readonly iconRooster: IconDefinition = faCalendarAlt;
    readonly iconRecency: IconDefinition = faTachometerAlt;
    readonly iconPVB: IconDefinition = faAvianex;
    readonly iconStatus: IconDefinition = faBookmark;
    readonly iconExpand: IconDefinition = faExternalLinkSquareAlt;
    readonly iconPlane: IconDefinition = faPlane;
    readonly iconTracks: IconDefinition = faAddressCard;

    private typesAbonnement: Subscription;
    lidTypes: HeliosType[] = [];
    statusTypes: HeliosType[] = [];
    lidData: HeliosLid;

    private datumAbonnement: Subscription; // volg de keuze van de kalender
    datum: DateTime = DateTime.now();      // de gekozen dag

    isDDWVer = false;             // is ingelogde gebruiker een DDWV'er
    saldoTonen = false;           // Tonen van DDWV saldo
    toonTracks = false;           // mogen de tracks vertoond worden

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    @ViewChild('logboekPopup') private popupLogboek: ModalComponent;
    @ViewChild('dienstenPopup') private popupDiensten: ModalComponent;
    @ViewChild(TransactiesComponent) transactieScherm: TransactiesComponent;
    @ViewChild(StartEditorComponent) private startEditor: StartEditorComponent;

    verwijderMode = false;
    magVerwijderen = false;


    constructor(private readonly ddwvService: DdwvService,
                private readonly ledenService: LedenService,
                private readonly loginService: LoginService,
                private readonly typesService: TypesService,
                private readonly trackService: TracksService,
                private readonly sharedService: SharedService,
                private readonly configService: PegasusConfigService,
                private readonly startlijstService: StartlijstService,
                private readonly progressieService: ProgressieService,
                private readonly router: Router,
                private activatedRoute: ActivatedRoute) {
    }

    ngOnInit(): void {
        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
            if (jaarMaand.year > 1900) {        // 1900 is bij initialisatie
                this.datum = DateTime.fromObject({
                    year: jaarMaand.year,
                    month: jaarMaand.month,
                    day: 1
                })
            }
        })

        // abonneer op wijziging van lidTypes
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.lidTypes = dataset!.filter((t: HeliosType) => {
                return t.GROEP == 6
            });          // lidtypes
            this.statusTypes = dataset!.filter((t: HeliosType) => {
                return t.GROEP == 19
            });      // status types (DBO, solo, brevet)```````
        });

        // Als lidID is meegegeven in URL, moeten we de lidData ophalen
        this.activatedRoute.queryParams.subscribe(params => {
            const hl= this.loginService.userInfo?.LidData as HeliosLid;
            let lidID = hl.ID!
            if (params['lidID']) {
                lidID = params['lidID'];
            }

            this.ledenService.getLid(lidID).then((l) => {
                this.lidData = l
                this.isDDWVer = (this.lidData.LIDTYPE_ID == 625);

                this.magSaldoTonen();
            });
        });

        const ui = this.loginService.userInfo?.Userinfo;

        if (ui?.isStarttoren) {
            this.router.navigate(['vluchten']);
        }

        this.toonTracks = (ui?.isBeheerder || ui?.isInstructeur || ui?.isCIMT) ? true : false;
        this.magVerwijderen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT || ui?.isInstructeur) ? true : false;

        const myCarouselElement = document.querySelector('#myCarousel')
    }

    ngOnDestroy(): void {
        if (this.datumAbonnement) this.datumAbonnement.unsubscribe();
        if (this.typesAbonnement) this.typesAbonnement.unsubscribe();
    }

    // Met welk lidmaatschap hebben te maken, geef de omschrijving
    getLidType(): string {
        const t = this.lidTypes.find(type => type.ID == this.lidData.LIDTYPE_ID) as HeliosType;
        if (t) {
            return t.OMSCHRIJVING!;
        }
        return "";
    }

    // Welke vlieg status heeft dit lid
    getStatusType(): string {
        const t = this.statusTypes.find(type => type.ID == this.lidData.STATUSTYPE_ID) as HeliosType;
        if (t) {
            return t.OMSCHRIJVING!;
        }
        return "";
    }

    // laat meer vluchten zien van logboek in een popupLogboek window
    toonLogboekGroot(): void {
        this.popupLogboek.open();
    }

    toonDienstenGroot() {
        this.popupDiensten.open();
    }

    // mogen we vlieger status aanpassen
    statusWijzigbaar(): boolean {
        const ui = this.loginService.userInfo?.Userinfo;
        return (ui?.isBeheerder! || ui?.isCIMT!);
    }

    // Toevoegen van een start
    addStart() {
        this.startEditor.openPopup(null);
    }

    // export het vlieger logboek naar excel
    exportLogboek() {
        if (this.lidData.ID) {
            const startDatum: DateTime = DateTime.fromObject({year: this.datum.year, month: 1, day: 1});
            const eindDatum: DateTime = DateTime.fromObject({year: this.datum.year, month: 12, day: 31});

            this.startlijstService.getLogboek(this.lidData.ID, startDatum, eindDatum).then((dataset) => {

                // maak een kopie, anders wordt dataset aangepast en dan gaat het later fout
                const toExcel: HeliosLogboekDataset[] = JSON.parse(JSON.stringify(dataset));
                // Datum in juiste formaat zetten
                toExcel.forEach((start) => {
                    const d = DateTime.fromSQL(start.DATUM!);
                    start.DATUM = d.day + "-" + d.month + "-" + d.year
                })

                const ws = xlsx.utils.json_to_sheet(toExcel);
                const wb: xlsx.WorkBook = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(wb, ws, 'Blad 1');
                xlsx.writeFile(wb, 'logboek ' + this.datum.year.toString() + '-' + new Date().toJSON().slice(0, 10) + '.xlsx');
            });
        }
    }

    // export de comptentiekaart naar excel
    exportProgressieKaart() {
        if (this.lidData.ID) {
            this.progressieService.getProgressieKaart(this.lidData.ID).then((dataset) => {

                // velden die voor de gebruiker nutteloos zijn, halen we weg
                for (let i = 0; i < dataset.length; i++) {
                    dataset[i].ID = undefined;
                    dataset[i].LEERFASE_ID = undefined;
                    dataset[i].BLOK_ID = undefined;
                    dataset[i].PROGRESSIE_ID = undefined;
                }
                const ws = xlsx.utils.json_to_sheet(dataset);
                const wb: xlsx.WorkBook = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(wb, ws, 'Blad 1');
                xlsx.writeFile(wb, 'progressiekaart ' + this.lidData.NAAM + '-' + new Date().toJSON().slice(0, 10) + '.xlsx');
            });
        }
    }

    // aanpassen van de vliegstatus in lid record
    wijzigVliegStatus() {
        const upd: HeliosLid = {ID: this.lidData.ID, STATUSTYPE_ID: this.lidData.STATUSTYPE_ID}

        this.ledenService.updateLid(upd).then((l) => {
            this.error = undefined;

            const ui = this.loginService.userInfo?.LidData
            if (l.ID == ui!.ID) {
                this.success = {titel: "Profiel", beschrijving: "Uw vliegstatus is aangepast"}
            } else {
                this.success = {titel: "Profiel", beschrijving: "Vliegstatus van " + l.NAAM + " is aangepast"}
            }
        }).catch(e => {
            this.success = undefined;
            this.error = e;
        });
    }

    getMeta(url:string) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject();
            img.src = url;
        });
    }

    async exportTracks(ID: number) {

        // bereken hoogte / breedte
        const img = new Image()
        img.src = "/assets/img/logo.png";
        await img.decode();
        const imgHoogte = 100;
        const imgBreedte = imgHoogte * img.naturalHeight / img.naturalWidth;

        // ophalen van img tbv document
        const imgResponse = await fetch ("/assets/img/logo.png");
        const image = await imgResponse.arrayBuffer();

        this.trackService.getTracks(false, ID).then((dataset) => {
            const docInhoud = [];

            docInhoud.push(
                new Paragraph({
                    text: "Track van " + this.lidData.NAAM,
                    heading: HeadingLevel.HEADING_1,
                    thematicBreak: true,
                }))

            docInhoud.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "",
                            break: 1,
                        })
                    ]
                })
            )
            for (let i = 0; i < dataset.length; i++) {
                const trk = dataset[i];
                docInhoud.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                    text: "Op " + this.datumString(trk.INGEVOERD!) + " om " + this.tijdString(trk.INGEVOERD!) + " schreef " + trk.INSTRUCTEUR_NAAM + ":",
                                    font: "Calibri",
                                    underline: {
                                        type: UnderlineType.SINGLE,
                                        color: "990011",
                                    },
                                }
                            ),
                            new TextRun({
                                text: "",
                                break: 1,
                            }),
                            new TextRun({
                                text: trk.TEKST,
                                font: "Calibri",
                            }),
                            new TextRun({
                                text: "",
                                break: 1,
                            })
                        ]
                    })
                )
            }

            const doc = new Document({
                sections: [
                    {
                        properties: {
                            page: {
                                pageNumbers: {
                                    start: 1,
                                    formatType: NumberFormat.DECIMAL,
                                },
                            },
                        },
                        headers: {
                            default: new Header({
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.RIGHT,
                                        children: [
                                            new ImageRun({
                                                data: image,
                                                transformation: {
                                                    width: imgHoogte,
                                                    height: imgBreedte,
                                                },
                                            })
                                        ]
                                    })
                                ]
                            })
                        },
                        footers: {
                            default: new Footer({
                                children: [
                                    new Paragraph ({
                                        alignment: AlignmentType.LEFT,
                                        children: [
                                            new TextRun(this.datumString() + " " + this.tijdString())
                                        ],
                                    }),
                                    new Paragraph ({
                                        alignment: AlignmentType.RIGHT,
                                        children: [
                                            new TextRun({
                                                children: ["Pagina ", PageNumber.CURRENT, " van ", PageNumber.TOTAL_PAGES],
                                            }),
                                        ],
                                    }),
                                ]
                            }),
                        },
                        children: docInhoud
                    }
                ]
            });

            Packer.toBlob(doc).then((blob) => {
                saveAs(blob, 'tracks ' + this.lidData.NAAM + '-' + new Date().toJSON().slice(0, 10) + '.docx');
            });
        })
    }

    tijdString(dt: string|undefined = undefined): string {
        const datumtijd = dt ? DateTime.fromSQL(dt) : DateTime.now();
        return datumtijd.toFormat("HH:mm")
    }

    datumString(dt: string|undefined = undefined): string {
        const datumtijd = dt ? DateTime.fromSQL(dt) : DateTime.now();
        return datumtijd.day + "-" + datumtijd.month + "-" + datumtijd.year;
    }

    // gebruiker mag alleen logboek zien
    alleenLogboekTonen() : boolean  {
        if (this.toonTracks) {      // als je tracks mag zien, dan de rest ook
            return false;
        }
        if (this.isDDWVer) {
            return true;
        }

        const ui = this.loginService.userInfo?.LidData;
        return !(this.lidData &&  ui!.ID === this.lidData.ID)
    }

    // openen van windows voor het tonen van de transacties
    toonTransacties() {
        this.transactieScherm.openPopup(this.lidData!.ID!, this.ddwvService.magBestellen(this.lidData.TEGOED));
    }

    magSaldoTonen() {
        const ui = this.loginService.userInfo?.Userinfo;

        if (this.lidData) {
            // saldo tonen we alleen voor onszelf, behalve als we (DDWV) beheerder zijn, dan mogen we ook ondere leden zien
            if (this.lidData.ID == this.loginService.userInfo?.LidData?.ID) {
                this.saldoTonen = this.configService.saldoActief() && (ui!.isDDWV! || ui!.isClubVlieger!);
            } else {
                this.saldoTonen = this.configService.saldoActief() && (ui?.isBeheerder! || ui?.isBeheerderDDWV!);
            }
        }
    }

    opvragenLid() {
        this.ledenService.getLid(this.lidData!.ID!).then((lid: HeliosLid) => {
            this.lidData = lid;
        });
    }
}
