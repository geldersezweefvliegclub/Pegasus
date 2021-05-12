import { Component, OnDestroy, OnInit } from '@angular/core';
import { faPlane } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  planeicon = faPlane;

  constructor() { }


  ngOnInit() :void {
    console.log("home onInit")
  }

}
