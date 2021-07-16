import {Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {ModalComponent} from '../../../shared/components/modal/modal.component';
import {SharedService} from '../../../services/shared/shared.service';


@Component({
    selector: 'app-filter',
    templateUrl: './filter.component.html',
    styleUrls: ['./filter.component.scss']
})

export class FilterComponent {
    @Output() filterChanged: EventEmitter<void> = new EventEmitter<void>();
    @ViewChild(ModalComponent) private popup: ModalComponent;

    constructor(private readonly sharedService: SharedService) {
    }

    // Open filter dialoog met de filter opties
    openPopup() {
        this.popup.open();
    }

    // Er is een filter gewijzigd, meteen aan parent melden zodat data opgehaald kan worden
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
