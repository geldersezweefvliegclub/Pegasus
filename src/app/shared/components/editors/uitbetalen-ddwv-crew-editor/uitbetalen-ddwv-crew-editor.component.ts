import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { ModalComponent } from '../../modal/modal.component';
import { ErrorMessage, KeyValueArray, SuccessMessage } from '../../../../types/Utils';
import { HeliosDienstenDataset } from '../../../../types/Helios';
import { HeliosRoosterDagExtended } from '../../../../schermen/rooster/rooster-page/rooster-page.component';
import { DdwvService } from '../../../../services/apiservice/ddwv.service';


@Component({
    selector: 'app-uitbetalen-ddwv-crew-editor',
    templateUrl: './uitbetalen-ddwv-crew-editor.component.html',
    styleUrls: ['./uitbetalen-ddwv-crew-editor.component.scss']
})
export class UitbetalenDdwvCrewEditorComponent  {
    @ViewChild(ModalComponent) private popup: ModalComponent;
    @Output() refresh: EventEmitter<void> = new EventEmitter<void>();

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    isLoading = false;
    isSaving = false;

    datum: string;
    diensten: HeliosDienstenDataset[];
    uitbetalenCrew: KeyValueArray = {};

    constructor(private readonly ddwvService: DdwvService) {
    }

    // open popup, maar haal eerst de start op. De eerder ingevoerde tijd wordt als default waarde gebruikt
    // indien niet eerder ingvuld, dan de huidige tijd. Buiten de daglicht periode is het veld leeg
    openPopup(rooster: HeliosRoosterDagExtended) {
        this.datum = rooster.DATUM!;
        this.diensten = rooster.Diensten.filter((d) => d != null);

        this.popup.open();
    }

    uitbetalen() {
        let IDs = "";

        Object.entries(this.uitbetalenCrew).forEach(([key, value]) => {
            if (value == true) {     // alleen als er echt uitbetaald moet worden
                if (IDs !== "") {
                    IDs = IDs.concat(',');
                }
                IDs = IDs.concat(`${key}`)
            }
        })
        this.ddwvService.betaalCrew(this.datum, IDs).then(() => {
            this.success = { titel: "Uitbetaling", beschrijving: "Transactie(s) opgeslagen"};
            this.popup.close();
        }).catch((e) => this.error = e)
    }

    selectieChanged($event: Event, ID: number) {
        this.uitbetalenCrew[ID.toString()] = ($event.target as HTMLInputElement).checked;
    }
}
