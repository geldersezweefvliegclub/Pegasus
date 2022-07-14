import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {ModalComponent} from '../modal/modal.component';
import {SharedService} from '../../../services/shared/shared.service';


@Component({
    selector: 'app-leden-filter',
    templateUrl: './leden-filter.component.html',
    styleUrls: ['./leden-filter.component.scss']
})

export class LedenFilterComponent {
    @Input() LedenDDWV:boolean = true;
    @Output() filterChanged: EventEmitter<void> = new EventEmitter<void>();
    @ViewChild(ModalComponent) private popup: ModalComponent;

    constructor(readonly sharedService: SharedService) {
    }

    // Open leden-filter dialoog met de leden-filter opties
    openPopup() {
        this.popup.open();
    }

    // Er is een leden-filter gewijzigd, meteen aan parent melden zodat starts opgehaald kan worden
    filterDataChanged() {
        this.filterChanged.emit();
    }

    // DDWV en leden mogen niet tegelijk 'aan' staan, dan is dataset altijd leeg
    filterLedenChanged(checked: any) {
        if ((checked) && (this.sharedService.ledenlijstFilter.ddwv)) {
            this.sharedService.ledenlijstFilter.ddwv = false;
        }
        this.filterChanged.emit();
    }

    // DDWV en leden mogen niet tegelijk 'aan' staan, dan is dataset altijd leeg
    filterDDWVChanged(checked: any) {
        if ((checked) && (this.sharedService.ledenlijstFilter.leden)) {
            this.sharedService.ledenlijstFilter.leden = false;
        }
        this.filterChanged.emit();
    }
}
