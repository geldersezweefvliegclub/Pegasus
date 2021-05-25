import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LedenGridComponent } from './leden-grid.component';

describe('LedenGridComponent', () => {
  let component: LedenGridComponent;
  let fixture: ComponentFixture<LedenGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LedenGridComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LedenGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
