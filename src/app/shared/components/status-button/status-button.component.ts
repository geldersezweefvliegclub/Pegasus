import {Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';
import {SchermGrootte, SharedService} from "../../../services/shared/shared.service";
import {far, IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {fas} from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: 'app-status-button',
  templateUrl: './status-button.component.html',
  styleUrls: ['./status-button.component.scss']
})
export class StatusButtonComponent implements OnInit {
  @Input() tekst: string = '';
  @Input() disabled: boolean = false;
  @Input() actief: boolean = false;
  @Input() iconNaam: string;

  @Output() btnClicked: EventEmitter<boolean> = new EventEmitter<boolean>();

  faIcon: IconDefinition;
  toonTekst: boolean = true;

  constructor(private readonly sharedService: SharedService) {}

  ngOnInit(): void {
    this.toonTekst = (this.sharedService.getSchermSize() > SchermGrootte.md)

    if (this.iconNaam) {
      let parts: string[] = this.iconNaam.split(' ');

      if (parts.length != 2) {
        console.error('iconNaam moet 2 parameters hebben');
        this.faIcon = fas['faQuestion'];
      } else {
        if (parts[0] == 'fas') {
          this.faIcon = fas['fa' + parts[1]];
        } else {
          this.faIcon = far['fa' + parts[1]];
        }

        if (!this.faIcon) {
          console.log('fa' + parts[1]);
          console.log('fas', fas);
          console.log('far', far);
          this.faIcon = fas['faExclamation'];
        }
      }
    }
  }

  buttonClicked() {
    this.actief = !this.actief;
    this.btnClicked.emit(this.actief);
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.toonTekst = (this.sharedService.getSchermSize() > SchermGrootte.md)
  }
}
