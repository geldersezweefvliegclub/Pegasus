import {Component, OnInit} from '@angular/core';
import {faPlane} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {
  planeicon = faPlane;

  constructor() { }


  ngOnInit() :void {
    console.log("home onInit")
  }

}
