import {Component, OnInit} from '@angular/core';
import {routes} from '../../routing.module';


@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {
  routes = routes;

  constructor() {
  }

  ngOnInit() {
  }

}
