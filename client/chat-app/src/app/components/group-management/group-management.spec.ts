import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupManagement } from './group-management';

describe('GroupManagement', () => {
  let component: GroupManagement;
  let fixture: ComponentFixture<GroupManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
