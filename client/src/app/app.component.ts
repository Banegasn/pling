import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Pling!';

  constructor(private titleService: Title) {
    this.titleService.setTitle(this.title);

    let userSettings = JSON.parse(localStorage.getItem('settings'));
    if ( !userSettings ) {
      userSettings = {};
      userSettings.name = prompt('Enter your name');
      localStorage.setItem('settings', JSON.stringify(userSettings));
    }
  }

  ngOnInit() {}
}
