import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RoomService } from '../../services/room.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListComponent implements OnInit {

  users$: Observable<any[]>;

  constructor(private _room: RoomService) { }

  ngOnInit(): void {
    this.users$ = this._room.users$;
  }

}
