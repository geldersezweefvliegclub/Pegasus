import { Component, ElementRef, Input, OnChanges, SimpleChanges, viewChild } from '@angular/core';
import { ErrorMessage } from '../../../types/Utils';
import { NgClass } from '@angular/common';

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html',
    styleUrls: ['./error.component.scss'],
    imports: [NgClass]
})
export class ErrorComponent implements OnChanges{
  @Input() error: ErrorMessage | undefined = undefined;
  readonly errorOverlay = viewChild.required<ElementRef>('errorOverlay');

  showError = false;

  ngOnChanges(_: SimpleChanges) {
    this.showError = true;

    setTimeout(()=> { this.showError = false;  }, 3000);
  }
}
