import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TextToastComponent } from './text-toast.component';

describe('TextToastComponent', () => {
  let component: TextToastComponent;
  let fixture: ComponentFixture<TextToastComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TextToastComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
