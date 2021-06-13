import {Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {CustomError} from '../../../types/Utils';

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss']
})
export class ErrorComponent implements OnChanges{
  @Input() error: CustomError | undefined = undefined;
  @ViewChild('errorOverlay') errorOverlay: ElementRef;

  showError: boolean = false;

  ngOnChanges(changes: SimpleChanges) {
    this.showError = true;

    setTimeout(()=> { this.showError = false;  }, 3000);
  }
}
