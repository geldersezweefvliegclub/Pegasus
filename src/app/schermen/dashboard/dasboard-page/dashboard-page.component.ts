import { Component, OnDestroy, OnInit, inject, viewChild } from '@angular/core';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
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
} from '@fortawesome/free-solid-svg-icons';
import { LoginService } from '../../../services/apiservice/login.service';
import { HeliosLid, HeliosLogboekDataset, HeliosType } from '../../../types/Helios';
import { ActivatedRoute, Router } from '@angular/router';
import { LedenService } from '../../../services/apiservice/leden.service';
import { TypesService } from '../../../services/apiservice/types.service';
import { faAvianex } from '@fortawesome/free-brands-svg-icons';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { Subscription } from 'rxjs';
import { DateTime } from 'luxon';
import { SharedService } from '../../../services/shared/shared.service';
import * as xlsx from 'xlsx';
import { StartlijstService } from '../../../services/apiservice/startlijst.service';
import { ProgressieService } from '../../../services/apiservice/progressie.service';
import { ErrorMessage, SuccessMessage } from '../../../types/Utils';
import { StartEditorComponent } from '../../../shared/components/editors/start-editor/start-editor.component';
import { TracksService } from '../../../services/apiservice/tracks.service';
import {
  AlignmentType,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  NumberFormat,
  Packer,
  PageNumber,
  Paragraph,
  TextRun,
  UnderlineType,
} from 'docx';
import { saveAs } from 'file-saver';
import { FormsModule } from '@angular/forms';
import { NgbCarousel, NgbSlide } from '@ng-bootstrap/ng-bootstrap/carousel';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { LedenDocumentenComponent } from './leden-documenten/leden-documenten.component';
import { AgendaComponent } from '../../../shared/components/agenda/agenda.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { DienstenComponent } from '../../../shared/components/diensten/diensten.component';
import { ErrorComponent } from '../../../shared/components/error/error.component';
import { IconButtonComponent } from '../../../shared/components/icon-button/icon-button.component';
import { PegasusCardComponent } from '../../../shared/components/pegasus-card/pegasus-card.component';
import { ProgressieBoomComponent } from '../../../shared/components/progressie-boom/progressie-boom.component';
import { PvbComponent } from '../../../shared/components/pvb/pvb.component';
import { RecencyComponent } from '../../../shared/components/recency/recency.component';
import { StatusComponent } from '../../../shared/components/status/status.component';
import { SuccessComponent } from '../../../shared/components/success/success.component';
import { TracksComponent } from '../../../shared/components/tracks/tracks.component';
import { VerjaardagenComponent } from '../../../shared/components/verjaardagen/verjaardagen.component';
import { VliegerLogboekComponent } from '../../../shared/components/vlieger-logboek/vlieger-logboek.component';
import { VliegerLogboekTotalenComponent } from '../../../shared/components/vlieger-logboek-totalen/vlieger-logboek-totalen.component';

@Component({
    selector: 'app-dashboard',
    host: { class: 'scherm-pagina' },
    templateUrl: './dashboard-page.component.html',
    styleUrls: ['./dashboard-page.component.scss'],
    imports: [AgendaComponent, AvatarComponent, DienstenComponent, ErrorComponent, FormsModule, IconButtonComponent, LedenDocumentenComponent, ModalComponent, NgbCarousel, NgbSlide, FaIconComponent, PegasusCardComponent, ProgressieBoomComponent, PvbComponent, RecencyComponent, StartEditorComponent, StatusComponent, SuccessComponent, TracksComponent, VerjaardagenComponent, VliegerLogboekComponent, VliegerLogboekTotalenComponent]
})
export class DashboardPageComponent implements OnInit, OnDestroy {
    // variablen in html formulier
    protected readonly iconCardIcon: IconDefinition = faChartPie;
    protected readonly iconProgressie: IconDefinition = faChartLine;
    protected readonly iconLogboek: IconDefinition = faClipboardList;
    protected readonly iconRooster: IconDefinition = faCalendarAlt;
    protected readonly iconRecency: IconDefinition = faTachometerAlt;
    protected readonly iconPVB: IconDefinition = faAvianex;
    protected readonly iconStatus: IconDefinition = faBookmark;
    protected readonly iconExpand: IconDefinition = faExternalLinkSquareAlt;
    protected readonly iconPlane: IconDefinition = faPlane;
    protected readonly iconTracks: IconDefinition = faAddressCard;

    protected statusTypes: HeliosType[] = [];
    protected lidData: HeliosLid;
    protected datum: DateTime = DateTime.now();      // de gekozen dag
    protected toonTracks = false;           // mogen de tracks vertoond worden
    protected success: SuccessMessage | undefined;
    protected error: ErrorMessage | undefined;
    protected verwijderMode = false;
    protected magVerwijderen = false;

    // private variable voor ts script
    private readonly ledenService = inject(LedenService);
    private readonly loginService = inject(LoginService);
    private readonly typesService = inject(TypesService);
    private readonly trackService = inject(TracksService);
    private readonly sharedService = inject(SharedService);
    private readonly startlijstService = inject(StartlijstService);
    private readonly progressieService = inject(ProgressieService);
    private readonly router = inject(Router);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly popupLogboek = viewChild.required<ModalComponent>('logboekPopup');
    private readonly popupDiensten = viewChild.required<ModalComponent>('dienstenPopup');
    private readonly startEditor = viewChild.required(StartEditorComponent);

    private typesAbonnement: Subscription;
    private lidTypes: HeliosType[] = [];
    private datumAbonnement: Subscription; // volg de keuze van de kalender
    private isDDWVer = false;             // is ingelogde gebruiker een DDWV'er

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
            // niet ingelogd, app component stuurt ons door naar de login pagina
            const hl = this.loginService.userInfo?.LidData as HeliosLid | undefined;
            if (!hl) {
                return;
            }

            let lidID = hl.ID!
            if (params['lidID']) {
                lidID = params['lidID'];
            }

            this.ledenService.getLid(lidID).then((l) => {
                this.lidData = l
                this.isDDWVer = (this.lidData.LIDTYPE_ID == 625);
            });
        });

        const ui = this.loginService.userInfo?.Userinfo;

        if (ui?.isStarttoren) {
            this.router.navigate(['vluchten']);
        }

        this.toonTracks = (ui?.isBeheerder || ui?.isInstructeur || ui?.isCIMT) ? true : false;
        this.magVerwijderen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT || ui?.isInstructeur) ? true : false;
    }

    ngOnDestroy(): void {
        if (this.datumAbonnement) this.datumAbonnement.unsubscribe();
        if (this.typesAbonnement) this.typesAbonnement.unsubscribe();
    }

    // Met welk lidmaatschap hebben te maken, geef de omschrijving
    protected getLidType(): string {
        const t = this.lidTypes.find(type => type.ID == this.lidData.LIDTYPE_ID) as HeliosType;
        if (t) {
            return t.OMSCHRIJVING!;
        }
        return "";
    }

    // Welke vlieg status heeft dit lid
    protected getStatusType(): string {
        const t = this.statusTypes.find(type => type.ID == this.lidData.STATUSTYPE_ID) as HeliosType;
        if (t) {
            return t.OMSCHRIJVING!;
        }
        return "";
    }

    // laat meer vluchten zien van logboek in een popupLogboek window
    protected toonLogboekGroot(): void {
        this.popupLogboek().open();
    }

    protected toonDienstenGroot() {
        this.popupDiensten().open();
    }

    // mogen we vlieger status aanpassen
    protected statusWijzigbaar(): boolean {
        const ui = this.loginService.userInfo?.Userinfo;
        return (ui?.isBeheerder || ui?.isCIMT) ?? false;
    }

    // Toevoegen van een start
    protected addStart() {
        this.startEditor().openPopup(null);
    }

    // export het vlieger logboek naar excel
    protected exportLogboek() {
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
    protected exportProgressieKaart() {
        if (this.lidData.ID) {
            this.progressieService.getProgressieKaart(this.lidData.ID).then((dataset) => {

                // velden die voor de gebruiker nutteloos zijn, halen we weg
                for (const item of dataset) {
                    item.ID = undefined;
                    item.LEERFASE_ID = undefined;
                    item.OUDER_ID = undefined;
                    item.PROGRESSIE_ID = undefined;
                }
                const ws = xlsx.utils.json_to_sheet(dataset);
                const wb: xlsx.WorkBook = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(wb, ws, 'Blad 1');
                xlsx.writeFile(wb, 'progressiekaart ' + this.lidData.NAAM + '-' + new Date().toJSON().slice(0, 10) + '.xlsx');
            });
        }
    }

    // aanpassen van de vliegstatus in lid record
    protected wijzigVliegStatus() {
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

    protected async exportTracks(ID: number) {

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
            for (const trk of dataset) {
                const paragraph = new Paragraph({
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
                });
                docInhoud.push(paragraph);
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
                                                type: "png",
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

    private tijdString(dt: string|undefined = undefined): string {
        const datumtijd = dt ? this.sharedService.parseDatum(dt) : DateTime.now();
        return datumtijd.toFormat("HH:mm")
    }

    private datumString(dt: string|undefined = undefined): string {
        const datumtijd = dt ? this.sharedService.parseDatum(dt) : DateTime.now();
        return datumtijd.day + "-" + datumtijd.month + "-" + datumtijd.year;
    }

    // gebruiker mag alleen logboek zien
    protected alleenLogboekTonen() : boolean  {
        if (this.toonTracks) {      // als je tracks mag zien, dan de rest ook
            return false;
        }
        if (this.isDDWVer) {
            return true;
        }

        const ui = this.loginService.userInfo?.LidData;
        return !(this.lidData &&  ui!.ID === this.lidData.ID)
    }
}
