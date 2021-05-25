import { Component, OnInit } from '@angular/core';
import {VliegtuigenService} from "../../services/vliegtuigen/vliegtuigen.service";
import { ZitplaatsRenderComponent } from './zitplaats-render/zitplaats-render.component';

@Component({
  selector: 'app-vliegtuigen-grid',
  templateUrl: './vliegtuigen-grid.component.html',
  styleUrls: ['./vliegtuigen-grid.component.scss']
})
export class VliegtuigenGridComponent implements OnInit {
  data = [];

  columns = [
    { field: 'REGISTRATIE', headerName: 'Registratie', sortable: true},
    { field: 'CALLSIGN', headerName: 'Callsign', sortable: true},
    { field: 'ZITPLAATSEN', headerName: 'Zitplaatsen', sortable: true, cellRenderer: 'zitplaatsRender' },
    { field: 'CLUBKIST', headerName: 'Clubkist', sortable: false },
    { field: 'VLIEGTUIGTYPE', headerName: 'Type', sortable: true},
    { field: 'FLARMCODE', headerName: 'Flarm', sortable: true},
    { field: 'ZELFSTART', headerName: 'Zelfstart', sortable: true },
    { field: 'SLEEPKIST', headerName: 'Sleepkist', sortable: true },
    { field: 'TMG', headerName: 'TMG', sortable: true, checkboxSelection: true}
  ];

  frameworkComponents = {
    zitplaatsRender: ZitplaatsRenderComponent,
  }

  constructor(private readonly vliegtuigenService: VliegtuigenService) { }

  ngOnInit(): void {
    this.vliegtuigenService.getVliegtuigen().then((dataset) => { this.data = dataset;});
  }
}