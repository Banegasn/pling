import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastService } from '@core/services/toast/toast.service';
import { RoomService } from '../../services/room.service';

@Component({
  selector: 'app-toast-messages',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastMessagesComponent implements OnInit, OnDestroy {

  private _onDestroy: Subject<void> = new Subject<void>();

  constructor(
    private _toast: ToastService,
    private _room: RoomService
  ) { }

  ngOnInit(): void {
    this._room.userJoined$().pipe(
      takeUntil(this._onDestroy),
    ).subscribe(() => {
      this._toast.text('An user has joined the room');
    });

    this._room.userLeft$().pipe(
      takeUntil(this._onDestroy),
    ).subscribe(() => {
      this._toast.text('An user has left the room');
    });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

}
