import {Component, Input, ViewChild, OnChanges, ElementRef, SimpleChanges} from '@angular/core';
import { error } from 'selenium-webdriver';
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
    console.log(changes)
    this.showError = true;

    setTimeout(()=> { this.showError = false;  }, 3000);
  }
}
