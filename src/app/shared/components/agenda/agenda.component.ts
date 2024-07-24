import { Component, OnInit } from '@angular/core';
import {AgendaService} from "../../../services/apiservice/agenda";
import {HeliosAgendaDataset} from "../../../types/Helios";
import {DateTime} from "luxon";

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss']
})
export class AgendaComponent implements OnInit {

  agenda: HeliosAgendaDataset[] = [];

  constructor(private readonly agendaService: AgendaService) { }

  ngOnInit(): void {
    const Vanaf = DateTime.now();
    const Tot = DateTime.fromSQL(DateTime.now().year + '-12-31')

    this.agendaService.getAgenda(Vanaf, Tot, 7).then((dataset) => {
      this.agenda = dataset;
    })
  }

  datumDM(dagDatum: string) {
    const dt = dagDatum.split(' ');
    const d = dt[0].split('-');
    return d[2] + '-' + d[1]
  }
}
