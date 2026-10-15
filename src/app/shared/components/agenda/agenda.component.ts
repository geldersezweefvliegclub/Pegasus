import { Component, OnInit, inject } from '@angular/core';
import { AgendaService } from '../../../services/apiservice/agenda';
import { HeliosAgendaDataset } from '../../../types/Helios';
import { DateTime } from 'luxon';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { SharedService } from '../../../services/shared/shared.service';

@Component({
    selector: 'app-agenda',
    templateUrl: './agenda.component.html',
    styleUrls: ['./agenda.component.scss'],
    imports: [FaIconComponent, NgbPopover]
})
export class AgendaComponent implements OnInit {
  private readonly agendaService = inject(AgendaService);
  private readonly sharedService = inject(SharedService);


  agenda: HeliosAgendaDataset[] = [];

  ngOnInit(): void {
    const Vanaf = DateTime.now();
    const Tot = DateTime.fromSQL(DateTime.now().year + '-12-31')

    this.agendaService.getAgenda(Vanaf, Tot, 7).then((dataset) => {
      this.agenda = dataset;
    })
  }

  datumDM(dagDatum: string) {
    return this.sharedService.datumDM(dagDatum);
  }

    protected readonly infoIcon = faInfoCircle;
}
