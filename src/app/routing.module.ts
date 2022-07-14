import {NgModule} from '@angular/core';
import {Route, RouterModule} from '@angular/router';

import {IconDefinition} from '@fortawesome/free-regular-svg-icons';
import {
    faAddressCard,
    faCalendarAlt,
    faCalendarDay,
    faChartPie, faGraduationCap,
    faKey, faKeyboard,
    faPen,
    faPlane,
    faPlaneDeparture,
    faUser,
    faUsers,
    faWaveSquare
} from '@fortawesome/free-solid-svg-icons';
import {AuditPageComponent} from "./schermen/audit/audit-page/audit-page.component";
import {TypesPageComponent} from "./schermen/types/types-page/types-page.component";
import {CompetentiesPageComponent} from "./schermen/competenties/competenties-page/competenties-page.component";
import {faAvianex} from "@fortawesome/free-brands-svg-icons";

export interface CustomRoute extends Route {
    excluded: boolean;
    icon: IconDefinition;
    text: string;
    batch?: any;
}

export const routes: CustomRoute[] = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
        excluded: true,
        icon: faUser,
        text: 'EXCLUDED'
    },
    {
        path: 'dashboard',
        loadChildren: () => import('./schermen/dashboard/dashboard.module').then(m => m.DashboardModule),
        excluded: false,
        icon: faChartPie,
        text: 'Dashboard'
    },
    {
        path: 'vluchten',
        loadChildren: () => import('./schermen/vluchten/vluchten.module').then(m => m.VluchtenModule),
        excluded: false,
        icon: faPlaneDeparture,
        text: 'Vluchten'
    },
    {
        path: 'startlijst',
        loadChildren: () => import('./schermen/startlijst/startlijst.module').then(m => m.StartlijstModule),
        excluded: false,
        icon: faPen,
        text: 'Start indeling'
    },
    {
        path: 'daginfo',
        loadChildren: () => import('./schermen/daginfo/daginfo.module').then(m => m.DaginfoModule),
        excluded: false,
        icon: faCalendarAlt,
        text: 'Dag info'
    },
    {
        path: 'tracks',
        loadChildren: () => import('./schermen/tracks/tracks.module').then(m => m.TracksModule),
        excluded: false,
        icon: faAddressCard,
        text: 'Tracks'
    },
    {
        path: 'reserveringen',
        loadChildren: () => import('./schermen/reservering/reservering.module').then(m => m.ReserveringModule),
        excluded: false,
        icon: faAvianex,
        text: 'Kist reserveren'
    },
    {
        path: 'leden',
        loadChildren: () => import('./schermen/leden/leden.module').then(m => m.LedenModule),
        excluded: false,
        icon: faUsers,
        text: 'Ledenlijst'
    },
    {
        path: 'vliegtuigen',
        loadChildren: () => import('./schermen/vliegtuigen/vliegtuigen.module').then(m => m.VliegtuigenModule),
        excluded: true,
        icon: faPlane,
        text: 'Vliegtuig logboek'
    },
    {
        path: 'vliegtuigen',
        loadChildren: () => import('./schermen/vliegtuigen/vliegtuigen.module').then(m => m.VliegtuigenModule),
        excluded: false,
        icon: faPlane,
        text: 'Vliegtuigen'
    },
    {
        path: 'login',
        loadChildren: () => import('./schermen/login/login.module').then(m => m.LoginModule),
        excluded: true,
        icon: faKey,
        text: 'Login'
    },
    {
        path: 'profiel',
        loadChildren: () => import('./schermen/profiel/profiel.module').then(m => m.ProfielModule),
        excluded: false,
        icon: faUser,
        text: 'Profiel'
    },
    {
        path: 'rooster',
        loadChildren: () => import('./schermen/rooster/rooster.module').then(m => m.RoosterModule),
        excluded: false,
        icon: faCalendarDay,
        text: 'Rooster'
    },

    {
        path: 'audit',
        loadChildren: () => import('./schermen/audit/audit.module').then(m => m.AuditModule),
        excluded: true,
        icon: faWaveSquare,
        text: 'Audit'
    },

    {
        path: 'types',
        loadChildren: () => import('./schermen/types/types.module').then(m => m.TypesModule),
        excluded: true,
        icon: faKeyboard,
        text: 'Types'
    },

    {
        path: 'competenties',
        loadChildren: () => import('./schermen/competenties/competenties.module').then(m => m.CompetentiesModule),
        excluded: true,
        icon: faGraduationCap,
        text: 'Competenties'
    },

    {
        path: '**',
        loadChildren: () => import('./schermen/not-found/not-found.module').then(m => m.NotFoundModule),
        excluded: true,
        icon: faUser,
        text: 'EXCLUDED'
    },
];

export const beheerRoutes: CustomRoute[] = [
    {path: 'audit', component: AuditPageComponent, excluded: false, icon: faWaveSquare, text: 'Audit'},
    {path: 'competenties', component: CompetentiesPageComponent, excluded: false, icon: faGraduationCap, text: 'Competenties'},
    {path: 'types', component: TypesPageComponent, excluded: false, icon: faKeyboard, text: 'Types'},

];


@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class RoutingModule {
}
