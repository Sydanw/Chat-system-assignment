import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelView } from './channel-view';

describe('ChannelView', () => {
  let component: ChannelView;
  let fixture: ComponentFixture<ChannelView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChannelView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
