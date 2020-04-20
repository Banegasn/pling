import { Component, ElementRef, ViewChild, AfterViewInit, Input } from '@angular/core';

@Component({
  selector: 'app-video-element',
  template: '<video #video autoplay></video>'
})
export class VideoElementComponent implements AfterViewInit {

  @ViewChild('video') private videoRef: ElementRef;
  private video: HTMLVideoElement;
  private stream: MediaStream;

  constructor() { }

  @Input()
  set src(stream: MediaStream) {
    this.stream = stream;
  }
  get src(): MediaStream {
    return this.video.srcObject as MediaStream;
  }

  ngAfterViewInit(): void {
    this.video = this.videoRef.nativeElement as HTMLVideoElement;
    this.video.srcObject = this.stream;
  }

  play() {
    this.video.play();
  }

  mute() {
    this.video.volume = 0;
  }

}
