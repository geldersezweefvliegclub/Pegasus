import {Component, OnInit, ViewChild} from '@angular/core';
import {VliegtuigenService} from '../../services/vliegtuigen/vliegtuigen.service';
import {ZitplaatsRenderComponent} from './zitplaats-render/zitplaats-render.component';
import {CheckboxRenderComponent} from '../../shared/components/datatable/checkbox-render/checkbox-render.component';
import {faPlane, faUser} from '@fortawesome/free-solid-svg-icons';
import {VliegtuigEditorComponent} from '../../shared/components/editors/vliegtuig-editor/vliegtuig-editor.component';
import {RowDoubleClickedEvent} from 'ag-grid-community';

@Component({
  selector: 'app-vliegtuigen-grid',
  templateUrl: './vliegtuigen-grid.component.html',
  styleUrls: ['./vliegtuigen-grid.component.scss']
})
export class VliegtuigenGridComponent implements OnInit {
  @ViewChild(VliegtuigEditorComponent) editor: VliegtuigEditorComponent;

  data = [];

  columns = [
    {field: 'REGISTRATIE', headerName: 'Registratie', sortable: true},
    {field: 'CALLSIGN', headerName: 'Callsign', sortable: true},
    {field: 'ZITPLAATSEN', headerName: 'Zitplaatsen', sortable: true, cellRenderer: 'zitplaatsRender'},
    {field: 'CLUBKIST', headerName: 'Clubkist', sortable: false, cellRenderer: 'checkboxRender'},
    {field: 'VLIEGTUIGTYPE', headerName: 'Type', sortable: true},
    {field: 'FLARMCODE', headerName: 'Flarm', sortable: true},
    {field: 'ZELFSTART', headerName: 'Zelfstart', sortable: true, cellRenderer: 'checkboxRender'},
    {field: 'SLEEPKIST', headerName: 'Sleepkist', sortable: true, cellRenderer: 'checkboxRender'},
    {field: 'TMG', headerName: 'TMG', sortable: true, cellRenderer: 'checkboxRender'}
  ];

  frameworkComponents = {
    zitplaatsRender: ZitplaatsRenderComponent,
    checkboxRender: CheckboxRenderComponent
  };
  user = faUser;
  vliegtuig = faPlane;

  constructor(private readonly vliegtuigenService: VliegtuigenService) {
  }

  ngOnInit(): void {
    this.vliegtuigenService.getVliegtuigen().then((dataset) => {
      this.data = dataset;
    });
  }

  openEditor(event?: RowDoubleClickedEvent) {
    this.editor.openPopup(event?.data);
  }
}

