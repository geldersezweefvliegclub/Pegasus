import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  huidigJaar : number = new Date().getFullYear();

  constructor() { }

  ngOnInit(): void {
    console.log("Footer init")
  }

}
