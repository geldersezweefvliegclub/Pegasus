import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoosterPageComponent } from './rooster-page.component';

describe('RoosterPageComponent', () => {
  let component: RoosterPageComponent;
  let fixture: ComponentFixture<RoosterPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RoosterPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RoosterPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
