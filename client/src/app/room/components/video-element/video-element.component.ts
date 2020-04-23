import { Component, ElementRef, ViewChild, AfterViewInit, Input } from '@angular/core';

@Component({
  selector: 'app-video-element',
  template: '<video #video autoplay></video>',
  styleUrls: ['./video-element.component.scss']
})
export class VideoElementComponent implements AfterViewInit {

  @ViewChild('video') private videoRef: ElementRef;
  private video: HTMLVideoElement;
  private stream: MediaStream;
  private volume = 1;

  constructor() { }

  @Input()
  set src(stream: MediaStream) {
    this.stream = stream;
    if (this.video) {
      this.video.srcObject = this.stream;
    }
  }
  get src(): MediaStream {
    return this.video.srcObject as MediaStream;
  }

  @Input()
  set muted(muted: boolean) {
    muted ? this.volume = 0 : this.volume = 1;
    if (this.video) {
      this.video.volume = this.volume;
    }
  }

  ngAfterViewInit(): void {
    this.video = this.videoRef.nativeElement as HTMLVideoElement;
    this.video.srcObject = this.stream;
    this.video.volume = this.volume;
  }

  play() {
    this.video.play();
  }

  mute() {
    this.video.volume = 0;
  }

}
