import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TextToastComponent } from './templates/text-toast.component';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  durationInSeconds = 5;

  constructor(private _snackBar: MatSnackBar) {}

  text(message: string) {
    this._snackBar.openFromComponent(TextToastComponent, {
      duration: this.durationInSeconds * 1000,
      data: message
    });
  }
}
