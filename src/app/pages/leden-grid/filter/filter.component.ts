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

    openPopup() {
        this.popup.open();
    }

    filterDataChanged() {
        this.filterChanged.emit();
    }

    filterLedenChanged(checked: any) {
        if ((checked) && (this.sharedService.ledenlijstFilter.ddwv)) {
            this.sharedService.ledenlijstFilter.ddwv = false;
        }
        this.filterChanged.emit();
    }

    filterDDWVChanged(checked: any) {
        if ((checked) && (this.sharedService.ledenlijstFilter.leden)) {
            this.sharedService.ledenlijstFilter.leden = false;
        }
        this.filterChanged.emit();
    }
}
