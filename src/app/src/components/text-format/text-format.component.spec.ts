import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextFormatComponent } from './text-format.component';

describe('TextFormatComponent', () => {
  let component: TextFormatComponent;
  let fixture: ComponentFixture<TextFormatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextFormatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextFormatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
