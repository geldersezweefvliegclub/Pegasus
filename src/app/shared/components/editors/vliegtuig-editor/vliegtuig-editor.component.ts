import {Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {ModalComponent} from '../../modal/modal.component';
import {HeliosType, HeliosVliegtuig} from '../../../../types/Helios';
import {VliegtuigenService} from '../../../../services/vliegtuigen/vliegtuigen.service';
import {TypesService} from '../../../../services/types/types.service';
import {faEdit, faPlus, faTrashAlt, faUndo} from '@fortawesome/free-solid-svg-icons';
import {coerceStringArray} from "@angular/cdk/coercion";

@Component({
    selector: 'app-vliegtuig-editor',
    templateUrl: './vliegtuig-editor.component.html',
    styleUrls: ['./vliegtuig-editor.component.scss']
})
export class VliegtuigEditorComponent {
    @Output() onAdd: EventEmitter<HeliosVliegtuig> = new EventEmitter<HeliosVliegtuig>();
    @Output() onUpdate: EventEmitter<HeliosVliegtuig> = new EventEmitter<HeliosVliegtuig>();
    @Output() onDelete: EventEmitter<number> = new EventEmitter<number>();
    @Output() onRestore: EventEmitter<number> = new EventEmitter<number>();

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
    };
    vliegtuigTypes: HeliosType[];

    isLoading: boolean = false;

    isVerwijderMode: boolean = false;
    isRestoreMode: boolean = false;
    formTitel: string = "";

    constructor(
        private readonly vliegtuigenService: VliegtuigenService,
        private readonly typesService: TypesService
    ) {
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
        this.vliegtuigenService.getVliegtuig(id).then((vliegtuig) => {
            this.vliegtuig = vliegtuig;
        });
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
            this.onRestore.emit(this.vliegtuig.ID);
        }

        if (this.isVerwijderMode) {
            this.onDelete.emit(this.vliegtuig.ID);
        }

        if (!this.isVerwijderMode && !this.isRestoreMode) {
            if (this.vliegtuig.ID) {
                this.onUpdate.emit(this.vliegtuig);
            } else {
                this.onAdd.emit(this.vliegtuig);
            }
        }
    }
}
