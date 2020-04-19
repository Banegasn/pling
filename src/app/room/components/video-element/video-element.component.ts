import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-video-element',
  template: '<video #video></video>'
})
export class VideoElementComponent implements AfterViewInit {

  @ViewChild('video') private videoRef: ElementRef;
  private video: HTMLVideoElement;

  constructor() { }

  ngAfterViewInit(): void {
    this.video = this.videoRef.nativeElement as HTMLVideoElement;
  }

  set src(stream: MediaStream | MediaSource | Blob) {
    this.video.srcObject = stream;
  }

  get src(): MediaStream | MediaSource | Blob {
    return this.video.srcObject;
  }

  play() {
    this.video.play();
  }

  mute() {
    this.video.volume = 0;
  }

}
