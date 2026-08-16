import { Route } from '@angular/router';
import { faFile, IconDefinition } from '@fortawesome/free-regular-svg-icons';
import {
  faAddressCard,
  faBug,
  faCalendar,
  faCalendarAlt,
  faCalendarDay,
  faChartPie,
  faEuroSign,
  faFilm,
  faGraduationCap,
  faKey,
  faKeyboard,
  faLayerGroup,
  faPlane,
  faPlaneDeparture,
  faStreetView,
  faUser,
  faUsers,
  faWaveSquare,
} from '@fortawesome/free-solid-svg-icons';
import { faAvianex } from '@fortawesome/free-brands-svg-icons';

export interface CustomRoute extends Route {
    excluded: boolean;
    icon: IconDefinition;
    text: string;
    batch?: string;
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
        path: 'login',
        loadComponent: () => import('./schermen/login/login-page/login-page.component').then(m => m.LoginPageComponent),
        excluded: true,
        icon: faKey,
        text: 'Login'
    },
    {
        path: 'hoofdscherm',
        loadComponent: () => import('./schermen/hoofmenu/hoofdscherm/hoofdscherm.component').then(m => m.HoofdschermComponent),
        excluded: true,
        icon: faKey,
        text: 'Hoofdscherm'
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./schermen/dashboard/dasboard-page/dashboard-page.component').then(m => m.DashboardPageComponent),
        excluded: false,
        icon: faChartPie,
        text: 'Dashboard'
    },
    {
        path: 'aanmelden',
        loadComponent: () => import('./schermen/aanmelden/aanmelden-page/aanmelden-page.component').then(m => m.AanmeldenPageComponent),
        excluded: false,
        icon: faStreetView,
        text: 'Aanmelden'
    },
    {
        path: 'vluchten',
        loadComponent: () => import('./schermen/vluchten/vluchten-grid/vluchten-grid.component').then(m => m.VluchtenGridComponent),
        excluded: false,
        icon: faPlaneDeparture,
        text: 'Vluchten'
    },
    {
        path: 'daginfo',
        loadComponent: () => import('./schermen/daginfo/daginfo/daginfo.component').then(m => m.DaginfoComponent),
        excluded: false,
        icon: faCalendarAlt,
        text: 'Dag info'
    },
    {
        path: 'tracks',
        loadComponent: () => import('./schermen/tracks/tracks-grid/tracks-grid.component').then(m => m.TracksGridComponent),
        excluded: false,
        icon: faAddressCard,
        text: 'Tracks'
    },
    {
        path: 'reserveringen',
        loadComponent: () => import('./schermen/reservering/reservering-page/reservering-page.component').then(m => m.ReserveringPageComponent),
        excluded: false,
        icon: faAvianex,
        text: 'Kist reserveren'
    },
    {
        path: 'leden',
        loadComponent: () => import('./schermen/leden/leden-scherm/leden-scherm.component').then(m => m.LedenSchermComponent),
        excluded: false,
        icon: faUsers,
        text: 'Ledenlijst'
    },
    {
        path: 'vliegtuigen',
        loadComponent: () => import('./schermen/vliegtuigen/vliegtuigen-scherm/vliegtuigen-scherm.component').then(m => m.VliegtuigenSchermComponent),
        excluded: false,
        icon: faPlane,
        text: 'Vliegtuigen'
    },
    {
        path: 'profiel',
        loadComponent: () => import('./schermen/profiel/profiel/profiel-page.component').then(m => m.ProfielPageComponent),
        excluded: false,
        icon: faUser,
        text: 'Profiel'
    },
    {
        path: 'rooster',
        loadComponent: () => import('./schermen/rooster/rooster-page/rooster-page.component').then(m => m.RoosterPageComponent),
        excluded: false,
        icon: faCalendarDay,
        text: 'Rooster'
    },
    {
        path: 'documenten',
        loadComponent: () => import('./schermen/documenten/documenten-scherm/documenten-scherm.component').then(m => m.DocumentenSchermComponent),
        excluded: false,
        icon: faFile,
        text: 'Documenten'
    },
    {
        path: 'journaal',
        loadComponent: () => import('./schermen/journaal/journaal-scherm/journaal-scherm.component').then(m => m.JournaalSchermComponent),
        excluded: false,
        icon: faBug,
        text: 'Journaal'
    },

    {
        path: 'audit',
        loadComponent: () => import('./schermen/audit/audit-page/audit-page.component').then(m => m.AuditPageComponent),
        excluded: true,
        icon: faWaveSquare,
        text: 'Audit'
    },

    {
        path: 'agenda',
        loadComponent: () => import('./schermen/agenda/agenda-scherm/agenda-scherm.component').then(m => m.AgendaSchermComponent),
        excluded: true,
        icon: faCalendar,
        text: 'Agenda'
    },

    {
        path: 'types',
        loadComponent: () => import('./schermen/types/types-page/types-page.component').then(m => m.TypesPageComponent),
        excluded: true,
        icon: faKeyboard,
        text: 'Types'
    },

    {
        path: 'competenties',
        loadComponent: () => import('./schermen/competenties/competenties-page/competenties-page.component').then(m => m.CompetentiesPageComponent),
        excluded: true,
        icon: faGraduationCap,
        text: 'Competenties'
    },

    {
        path: 'rapportage',
        loadComponent: () => import('./schermen/rapportage/rapport-scherm/rapport-scherm.component').then(m => m.RapportSchermComponent),
        excluded: true,
        icon: faFilm,
        text: 'Rapportage'
    },

    {
        path: 'facturen',
        loadComponent: () => import('./schermen/facturen/facturen-scherm/facturen-scherm.component').then(m => m.FacturenSchermComponent),
        excluded: true,
        icon: faLayerGroup,
        text: 'Facturen'
    },

    {
        path: 'transacties',
        loadComponent: () => import('./schermen/transacties/transacties-grid/transacties-grid.component').then(m => m.TransactiesGridComponent),
        excluded: true,
        icon: faEuroSign,
        text: 'Transacties'
    },

    {
        path: '**',
        loadComponent: () => import('./schermen/not-found/not-found/not-found.component').then(m => m.NotFoundComponent),
        excluded: true,
        icon: faUser,
        text: 'EXCLUDED'
    },
];

export const beheerRoutes: CustomRoute[] = [
    {path: 'agenda', loadComponent: () => import('./schermen/agenda/agenda-scherm/agenda-scherm.component').then(m => m.AgendaSchermComponent), excluded: false, icon: faCalendar, text: 'Agenda'},
    {path: 'audit', loadComponent: () => import('./schermen/audit/audit-page/audit-page.component').then(m => m.AuditPageComponent), excluded: false, icon: faWaveSquare, text: 'Audit'},
    {path: 'competenties', loadComponent: () => import('./schermen/competenties/competenties-page/competenties-page.component').then(m => m.CompetentiesPageComponent), excluded: false, icon: faGraduationCap, text: 'Competenties'},
    {path: 'types', loadComponent: () => import('./schermen/types/types-page/types-page.component').then(m => m.TypesPageComponent), excluded: false, icon: faKeyboard, text: 'Types'},
    {path: 'transacties', loadComponent: () => import('./schermen/transacties/transacties-grid/transacties-grid.component').then(m => m.TransactiesGridComponent), excluded: false, icon: faEuroSign, text: 'Transacties'},
    {path: 'rapportage', loadComponent: () => import('./schermen/rapportage/rapport-scherm/rapport-scherm.component').then(m => m.RapportSchermComponent), excluded: false, icon: faFilm, text: 'Rapportage'},
    {path: 'facturen', loadComponent: () => import('./schermen/facturen/facturen-scherm/facturen-scherm.component').then(m => m.FacturenSchermComponent), excluded: false, icon: faLayerGroup, text: 'Facturen'},
];
