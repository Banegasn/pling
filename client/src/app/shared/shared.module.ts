import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule } from '@angular/material/snack-bar';

const MODULES = [
    // Angular Modules
    CommonModule,
    LayoutModule,
    ReactiveFormsModule,
    RouterModule,
    // Meterial Modules
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatSnackBarModule,
];

const DECLARATIONS = [
];

const ENTRY_COMPONENTS = [
];

@NgModule({
    declarations: [...DECLARATIONS, ...ENTRY_COMPONENTS],
    entryComponents: ENTRY_COMPONENTS,
    imports: MODULES,
    exports: [...MODULES, ...DECLARATIONS]
})
export class SharedModule {
}
