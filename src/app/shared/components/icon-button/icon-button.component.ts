import {Component, Input, OnInit} from '@angular/core';
import {fas} from '@fortawesome/free-solid-svg-icons';
import {far, IconDefinition} from '@fortawesome/free-regular-svg-icons';

@Component({
  selector: 'app-icon-button',
  templateUrl: './icon-button.component.html',
  styleUrls: ['./icon-button.component.scss']
})
export class IconButtonComponent implements OnInit {
  @Input() tekst: string = "";
  @Input() iconNaam: string;
  @Input() btnColor: string = 'btn-secondary';
  @Input() disabled: boolean = false;
  @Input() type: 'button' | 'submit' = 'button';
  @Output() btnClicked: EventEmitter<void> = new EventEmitter<void>();

  faIcon: IconDefinition;

  ngOnInit(): void {
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
        console.log("fas", fas);
        console.log("far", far);
        this.faIcon = fas['faExclamation'];
      }
    }
  }

  buttonClicked() {
    this.btnClicked.emit();
  }
}
