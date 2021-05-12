import { Component, OnInit } from '@angular/core';
import { ROUTES, RouteInfo } from '../../app-routing.module';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  menuItems: RouteInfo[];

  constructor() { this.menuItems = ROUTES;}

  ngOnInit() {
    console.log("app-sidebar onInit")
  }

  isMobileMenu() {
      if (window.innerWidth > 991) {
          return false;
      }
      return true;
  };
}
