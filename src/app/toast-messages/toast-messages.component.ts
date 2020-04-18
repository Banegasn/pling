import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { SocketioService } from '../services/socketio.service';
import { Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'app-toast-messages',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastMessagesComponent implements OnInit, OnDestroy {

  private _onDestroy: Subject<void> = new Subject<void>();

  constructor(
    private _toast: ToastService,
    private _socket: SocketioService
  ) { }

  ngOnInit(): void {
    this._socket.listen('connected').pipe(
      tap(console.log),
      takeUntil(this._onDestroy),
    ).subscribe(data => {
      this._toast.text('An user has joined the room');
    });

    this._socket.listen('disconnected').pipe(
      tap(console.log),
      takeUntil(this._onDestroy),
    ).subscribe(data => {
      this._toast.text('An user has left the room');
    });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

}
