import {Component} from '@angular/core';
import {routes} from '../../routing.module';
import {UserService} from "../../services/userservice/user.service";
import {Router} from "@angular/router";
import {faSignOutAlt} from '@fortawesome/free-solid-svg-icons';


@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent {
  routes = routes;
  logUit = faSignOutAlt;

  constructor(private readonly loginService: UserService, private readonly router:Router) {
  }

  Uitloggen(): void {
    this.loginService.uitloggen();
    this.router.navigate(['/login']);
  }
}
