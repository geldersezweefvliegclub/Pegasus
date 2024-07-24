import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgendaSchermComponent } from './agenda-scherm.component';

describe('AgendaSchermComponent', () => {
  let component: AgendaSchermComponent;
  let fixture: ComponentFixture<AgendaSchermComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AgendaSchermComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgendaSchermComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
