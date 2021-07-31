import {Component, Input, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {ColDef} from "ag-grid-community";
import {nummerSort} from "../../../utils/Utils";
import {HeliosTrack, HeliosTracksDataset} from "../../../types/Helios";
import {TracksService} from "../../../services/apiservice/tracks.service";
import {TekstRenderComponent} from "./tekst-render/tekst-render.component";
import {SharedService} from "../../../services/shared/shared.service";
import {TrackEditorComponent} from "../editors/track-editor/track-editor.component";

@Component({
    selector: 'app-tracks',
    templateUrl: './tracks.component.html',
    styleUrls: ['./tracks.component.scss']
})
export class TracksComponent implements OnInit {
    @Input() VliegerID: number;
    @Input() VliegerNaam: string;
    @Input() toonLid: boolean = false;

    @ViewChild(TrackEditorComponent) trackEditor: TrackEditorComponent;

    data: HeliosTracksDataset[] = [];
    dataColumns: ColDef[] = [
        {field: 'ID', headerName: 'ID', sortable: true, hide: true, comparator: nummerSort},
        {field: 'TEKST',
            headerName: 'Tekst',
            sortable: false,
            menuTabs: [],
            cellRenderer: 'tekstRender',
            cellStyle: { "white-space": "pre-line", "line-height": "1.2em;" }, autoHeight: true },
    ];

    lidColumn: ColDef = {pinned: 'left', field: 'NAAM', headerName: 'Lid', sortable: false};

    frameworkComponents = {
        tekstRender: TekstRenderComponent
    };

    constructor(private readonly trackService: TracksService,
                private readonly sharedService: SharedService) {
    }

    ngOnInit(): void {
        if (this.toonLid) {
            this.dataColumns.push(this.lidColumn)
        }
        this.opvragen();

        // Als in de progressie tabel is aangepast, moet we onze dataset ook aanpassen
        this.sharedService.heliosEventFired.subscribe(ev => {
            if (ev.tabel == "Tracks") {
                if (ev.data.LID_ID == this.VliegerID) {
                    this.opvragen();
                }
            }
        });
    }

    // opvragen van de vlieger tracks
    opvragen(): void {
        this.trackService.getVliegerTracks(this.VliegerID).then((dataset) => {
            this.data = dataset;
        });
    }

    // open de track editor om nieuwe track toe te voegen. Edit opent als popup
    private openTrackEditor() {
        this.trackEditor.openPopup(null, this.VliegerID, undefined, this.VliegerNaam);
    }

    // Toevoegen van een vlieger track aan de database
    ToevoegenTrack(track: HeliosTrack): void {
        this.trackService.nieuwTrack(track);
        this.trackEditor.closePopup();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.hasOwnProperty("VliegerID")) {
            this.opvragen()
        }
    }


}
