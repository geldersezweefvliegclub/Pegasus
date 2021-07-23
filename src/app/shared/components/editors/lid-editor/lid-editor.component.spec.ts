import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LidEditorComponent } from './lid-editor.component';

describe('LedenEditorComponent', () => {
  let component: LidEditorComponent;
  let fixture: ComponentFixture<LidEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LidEditorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LidEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
