import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
  selector: 'app-text-toast',
  templateUrl: './text-toast.component.html',
  styleUrls: ['./text-toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextToastComponent {

  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: string
  ) {}

}
