import { Injectable } from '@angular/core';
import { Observable,  merge, Subject, BehaviorSubject } from 'rxjs';
import { RoomService } from './room.service';
import { VideoService } from './video.service';
import { take, switchMap, tap, filter, mergeMap, concatMap } from 'rxjs/operators';

const RTC_PEER_MESSAGE_SDP_OFFER = 'sdp-offer';
const RTC_PEER_MESSAGE_SDP_ANSWER = 'sdp-answer';
const RTC_PEER_MESSAGE_ICE = 'ice';
const RTC_PEER_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

@Injectable({
  providedIn: 'root'
})
export class WebrtcService {

  myStream$: BehaviorSubject<MediaStream> = new BehaviorSubject<MediaStream>(null);

  private _peerConnections: RTCPeerConnection[] = [];
  private _initialized$ = new Subject<void>();

  constructor(
    private _room: RoomService,
    private _videoSrv: VideoService
  ) {

    this._initialized$
      .pipe(
        switchMap(() => this._room.messageRTC$())
      ).subscribe(data => {
        this.handleRTCPeerMessage(data);
      });

    this._videoSrv.AudioAndVideoStream$
      .pipe(take(1))
      .subscribe((stream) => {
        this.myStream$.next(stream);
        this._initialized$.next();
      });
  }

  start() {
    this._initialized$
    .pipe(
      concatMap(() => this._room.userJoined$().pipe(
        tap(data => {
          data.users.forEach((id: string) => {
            this.getPeerConnection(id);
          });
        })
      ))
    ).subscribe();

    this._room.userLeft$().pipe(
      tap(console.log),
      tap(data => this._room.deleteRoomie(data.id))
    ).subscribe();
  }

  private handleRTCPeerMessage(message: any) {

    const peerConnection = this.getPeerConnection(message.by);

    switch ( message.type ) {
      case RTC_PEER_MESSAGE_SDP_OFFER:
        peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp)).then(() => {
          console.log('Setting remote description by offer');
          peerConnection.createAnswer().then((sdp: RTCSessionDescriptionInit) => {
            console.log('on message offer send answer', sdp.type);
            peerConnection.setLocalDescription(sdp).then(() => {
              this._room.messageRTC({
                to: message.by, sdp, type: RTC_PEER_MESSAGE_SDP_ANSWER
              });
            });
          });
        }).catch(err => {console.error('Error on SDP-Offer:', err); });
        break;

      case RTC_PEER_MESSAGE_SDP_ANSWER:
        peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp)).then(() =>
          console.log('Setting remote description by answer')
        ).catch(err => console.error('Error on SDP-Answer:', err));
        break;

      case RTC_PEER_MESSAGE_ICE:
        if (message.ice) {
          console.log('Adding ice candidate');
          peerConnection.addIceCandidate(message.ice);
        }
        break;
    }
  }

  private getPeerConnection(id: string): RTCPeerConnection {

    if (this._peerConnections[id]) {
      return this._peerConnections[id];
    }

    console.log('creating RTCPeerConnection', {id, local: this._room.myId});

    // creates RTCPeerConnection object
    const peerConnection = new RTCPeerConnection(RTC_PEER_CONFIG);
    this._peerConnections[id] = peerConnection;

    // adds my tracks
    this.myStream$.getValue().getTracks().forEach(track => {
      peerConnection.addTrack(track, this.myStream$.getValue());
    });

    // received track
    peerConnection.ontrack = (event: RTCTrackEvent) => {
      this._room.addRoomie({id, stream: event.streams[0]});
    };

    // sends ice candidates
    peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        console.log('on ice candidate', event);
        this._room.messageRTC({to: id, ice: event.candidate, type: RTC_PEER_MESSAGE_ICE});
      }
    };

    peerConnection.onnegotiationneeded = () => {
      console.log('Need negotiation:', id);
      peerConnection.createOffer().then(sdp => {
        console.log(sdp.type);
        peerConnection.setLocalDescription(sdp).then(() => {
          this._room.messageRTC({to: id, sdp, type: RTC_PEER_MESSAGE_SDP_OFFER});
        });
      });
    };

    peerConnection.onsignalingstatechange = () => {
      console.log('ICE signaling state changed to:', peerConnection.signalingState, 'for client', id);
    };

    console.log('finish creating RTCPeerConnection', {id, local: this._room.myId}, peerConnection);

    return peerConnection;
  }

}
