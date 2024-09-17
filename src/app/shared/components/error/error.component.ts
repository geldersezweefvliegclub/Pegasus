import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { ErrorMessage } from '../../../types/Utils';

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss']
})
export class ErrorComponent implements OnChanges{
  @Input() error: ErrorMessage | undefined = undefined;
  @ViewChild('errorOverlay') errorOverlay: ElementRef;

  showError = false;

  ngOnChanges(_: SimpleChanges) {
    this.showError = true;

    setTimeout(()=> { this.showError = false;  }, 3000);
  }
}
