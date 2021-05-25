import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VliegtuigEditorComponent } from './vliegtuig-editor.component';

describe('VliegtuigEditorComponent', () => {
  let component: VliegtuigEditorComponent;
  let fixture: ComponentFixture<VliegtuigEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VliegtuigEditorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VliegtuigEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
