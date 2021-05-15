import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {IconCardComponent} from './icon-card.component';

describe('StatsCardComponent', () => {
  let component: IconCardComponent;
  let fixture: ComponentFixture<IconCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ IconCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IconCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
