import {Component, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {ModalComponent} from '../../modal/modal.component';
import {HeliosType, HeliosVliegtuig} from '../../../../types/Helios';
import {VliegtuigenService} from '../../../../services/apiservice/vliegtuigen.service';
import {TypesService} from '../../../../services/apiservice/types.service';

@Component({
    selector: 'app-vliegtuig-editor',
    templateUrl: './vliegtuig-editor.component.html',
    styleUrls: ['./vliegtuig-editor.component.scss']
})
export class VliegtuigEditorComponent  implements  OnInit {
    @Output() add: EventEmitter<HeliosVliegtuig> = new EventEmitter<HeliosVliegtuig>();
    @Output() update: EventEmitter<HeliosVliegtuig> = new EventEmitter<HeliosVliegtuig>();
    @Output() delete: EventEmitter<number> = new EventEmitter<number>();
    @Output() restore: EventEmitter<number> = new EventEmitter<number>();

    @ViewChild(ModalComponent) private popup: ModalComponent;

    vliegtuig: HeliosVliegtuig = {
        ID: undefined,
        REGISTRATIE: undefined,
        CALLSIGN: undefined,
        FLARMCODE: undefined,
        ZITPLAATSEN: undefined,
        ZELFSTART: undefined,
        CLUBKIST: undefined,
        TMG: undefined,
        SLEEPKIST: undefined,
        TYPE_ID: undefined,
        VOLGORDE: undefined,
        INZETBAAR: undefined,
        OPMERKINGEN: undefined
    };
    vliegtuigTypes: HeliosType[];

    isLoading: boolean = false;

    isVerwijderMode: boolean = false;
    isRestoreMode: boolean = false;
    formTitel: string = "";

    constructor(
        private readonly vliegtuigenService: VliegtuigenService,
        private readonly typesService: TypesService
    ) {}

    ngOnInit(): void {
        this.typesService.getTypes(4).then(types => this.vliegtuigTypes = types);
    }

    openPopup(id: number | null) {
        if (id) {
            this.formTitel = 'Vliegtuig bewerken';
            this.haalVliegtuigOp(id);
        } else {
            this.formTitel = 'Vliegtuig aanmaken';
            this.vliegtuig = {};
        }
        this.isVerwijderMode = false;
        this.isRestoreMode = false;
        this.popup.open();
    }

    closePopup() {
        this.popup.close();
    }

    haalVliegtuigOp(id: number): void {
        this.isLoading = true;

        try {
            this.vliegtuigenService.getVliegtuig(id).then((vliegtuig) => {
                this.vliegtuig = vliegtuig;
                this.isLoading = false;
            });
        } catch (e) {
            this.isLoading = false;
        }
    }

    openVerwijderPopup(id: number) {
        this.haalVliegtuigOp(id);
        this.formTitel = 'Vliegtuig verwijderen';
        this.isVerwijderMode = true;
        this.isRestoreMode = false;
        this.popup.open();
    }

    openRestorePopup(id: number) {
        this.haalVliegtuigOp(id);
        this.formTitel = 'Vliegtuig herstellen';
        this.isRestoreMode = true;
        this.isVerwijderMode = false;
        this.popup.open();
    }

    uitvoeren() {
        if (this.isRestoreMode) {
            this.restore.emit(this.vliegtuig.ID);
        }

        if (this.isVerwijderMode) {
            this.delete.emit(this.vliegtuig.ID);
        }

        if (!this.isVerwijderMode && !this.isRestoreMode) {
            if (this.vliegtuig.ID) {
                this.update.emit(this.vliegtuig);
            } else {
                this.add.emit(this.vliegtuig);
            }
        }
    }
}
