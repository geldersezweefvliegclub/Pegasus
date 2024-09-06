import {Injectable, OnInit} from '@angular/core';
import {PegasusConfigService} from "./shared/pegasus-config.service";
import {io, Socket} from "socket.io-client";
import {BehaviorSubject} from "rxjs";
import {DateTime} from "luxon";
import {LoginService} from "./apiservice/login.service";

export interface FlarmData {
  REG_CALL?: string;
  VELD_ID?: number;
  VLIEGTUIG_ID?: number;
  START_ID?: number;
  flarmID?: string;
  altitude_agl?: number;
  starttijd?: string;
  landingstijd?: string;
  speed?: number;
  climb?: number;
  status: string;
  ts?: number;
}

export interface FlarmStartData {
  START_ID: number;
  STARTTIJD: string | undefined;
  LANDINGSTIJD: string | undefined;
  OPMERKINGEN: string | undefined;
}

@Injectable({
  providedIn: 'root'
})
export class FlarmInputService  {
  private socket: Socket;
  public flarmCache: FlarmData[] = [];
  private flarmStore = new BehaviorSubject(this.flarmCache);
  public readonly flarmUpdate = this.flarmStore.asObservable();      // nieuwe flarm
  private startStore = new BehaviorSubject({START_ID: -1} as FlarmStartData);
  public readonly startUpdate = this.startStore.asObservable();

  constructor(private readonly loginService: LoginService,
              private readonly configService: PegasusConfigService)
  {
    const ui = this.loginService.userInfo?.Userinfo;
    if (!ui?.isStarttoren) {
      return;
    }
    console.log("Connecting to Flarm server at", this.configService.getFlarmURL());

    this.Connect();

    // Verwijderen flarm die niet meer gezien worden
    window.setInterval(() => {
      this.deleteLostFlarm()
    }, 1000 * 60 * 1);
  }

  // Opstarten van de verbinding met de Flarm server
  Connect() {
    this.socket = io(this.configService.getFlarmURL(), {transports: ['websocket']}).connect();

    this.socket.on("flarm", (message: any) => {

      // afhandelen van de binnenkomende flarm data
      const idx= this.inFlarmCache(message.flarmID);
      if (idx < 0) {
        this.flarmCache.push(message);
      }
      else {
        this.flarmCache[idx] = message;
      }
      // zit nu in de cache, dus stuur event naar de store
      this.flarmStore.next(this.flarmCache);
    })

    this.socket.on("start", (message: FlarmStartData) => {
      this.startStore.next(message);
    })
  }

  Disconnect() {
    this.socket.disconnect();
  }

  // hebben we al een flarm met deze ID?
  private inFlarmCache(flarmID: string): number {
    return this.flarmCache.findIndex((flarm) => flarm.flarmID === flarmID);
  }

  // na een kwartier geen data meer ontvangen, dan is de flarm waarschijnlijk weg, dus verwijderen
  private deleteLostFlarm() {
    const now = DateTime.now().hour * 60 + DateTime.now().minute;
    this.flarmCache = this.flarmCache.filter((flarm) => (now - flarm.ts!) < 15); // behoudt alles van de laatste 15 minuten
    this.flarmStore.next(this.flarmCache);
  }
}
