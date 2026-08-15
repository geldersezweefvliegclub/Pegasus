import { Component, Input } from '@angular/core';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'app-loader',
    templateUrl: './loader.component.html',
    styleUrls: ['./loader.component.scss'],
    imports: [FaIconComponent]
})
export class LoaderComponent {
  @Input() isLoading = false;
  loader = faCircleNotch;
}

