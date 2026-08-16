import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, inject } from '@angular/core';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { Subscription } from 'rxjs';
import { HeliosType, HeliosVliegtuigenDataset } from '../../../types/Helios';
import { TypesService } from '../../../services/apiservice/types.service';
import { VliegtuigenService } from '../../../services/apiservice/vliegtuigen.service';
import { journaalFilter } from '../../../services/apiservice/journaal.service';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent, NgOptionComponent } from '@ng-select/ng-select';
import { IconButtonComponent } from '../../../shared/components/icon-button/icon-button.component';


@Component({
    selector: 'app-meldingen-filter',
    templateUrl: './journaal-filter.component.html',
    styleUrls: ['./journaal-filter.component.scss'],
    imports: [ModalComponent, FormsModule, NgSelectComponent, NgOptionComponent, IconButtonComponent]
})
export class JournaalFilterComponent implements OnInit, OnDestroy {
    private readonly typesService = inject(TypesService);
    private readonly vliegtuigenService = inject(VliegtuigenService);

    @Input() activeFilter: journaalFilter;
    @ViewChild(ModalComponent) private popup: ModalComponent;
    @Output() aangepast: EventEmitter<void> = new EventEmitter<void>();

    private typesAbonnement: Subscription;

    categorieTypes: HeliosType[];
    statusTypes: HeliosType[];
    rollendTypes: HeliosType[];

    private vliegtuigenAbonnement: Subscription;
    clubVliegtuigen: HeliosVliegtuigenDataset[] = [];

    ngOnInit(): void {
        // abonneer op wijziging van transactie types
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.rollendTypes = dataset!.filter((t: HeliosType) => {
                return t.GROEP === 23
            });
            this.categorieTypes = dataset!.filter((t: HeliosType) => {
                return t.GROEP === 24
            });
            this.statusTypes = dataset!.filter((t: HeliosType) => {
                return t.GROEP === 25
            });
        });
        // abonneer op wijziging van vliegtuigen
        this.vliegtuigenAbonnement = this.vliegtuigenService.vliegtuigenChange.subscribe(vliegtuigen => {
            this.clubVliegtuigen = vliegtuigen!.filter((v) => {
                return v.CLUBKIST!;
            });
        });
    }

    ngOnDestroy(): void {
        if (this.typesAbonnement) this.typesAbonnement.unsubscribe();
        if (this.vliegtuigenAbonnement) this.vliegtuigenAbonnement.unsubscribe();
    }

    openPopup() {
        this.popup.open();
    }

    filter(): void {
        this.aangepast.emit();
    }
}
