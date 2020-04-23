import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';
import { switchMap, tap, take } from 'rxjs/operators';
import { SocketioService } from 'src/app/core/services/socket.io/socket.io.service';
import { RoomEvent } from '../../../room/models/roomUserJoin';
import { RoomService } from '../../../room/services/room.service';
import { VideoService } from '../../../room/services/video.service';
import { setMediaBitrate } from './webRTC.utils';

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
export class WebRTCService {

  private _myStream: BehaviorSubject<MediaStream> = new BehaviorSubject<MediaStream>(null);
  private _peerConnections: RTCPeerConnection[] = [];
  private _userJoined$: Observable<RoomEvent>;
  private _userLeft$: Observable<RoomEvent>;
  private _roomReady$: Observable<string[]>;
  private _listenRTCMessages$: Observable<any>;

  constructor(
    private _room: RoomService,
    private _socket: SocketioService,
    private _videoSrv: VideoService
  ) {
    this._roomReady$ = this._room.users$.pipe(
      take(1),
      tap(data => {
        data.filter(id => id !== this._socket.id)
          .forEach(id => this.getPeerConnection(id));
        console.log('readyyyy!', data);
      })
    );
    this._userJoined$ = this._room.userJoined$().pipe(
      tap(data => this.getPeerConnection(data.id))
    );
    this._userLeft$ = this._room.userLeft$().pipe(
      tap(data => this._room.deleteRoomie(data.id))
    );
    this._listenRTCMessages$ = this.messageRTC$().pipe(
      tap(data => this.handleRTCPeerMessage(data))
    );
  }

  start() {
    this._videoSrv.audioAndVideoStream$
    .pipe(
      tap(stream => this._myStream.next(stream)),
      switchMap(() => forkJoin([
        this._userJoined$,
        this._userLeft$,
        this._listenRTCMessages$,
        this._roomReady$
      ])),
    ).subscribe();
  }

  private messageRTC(data: any): void {
    this._socket.emit('peer-message', data);
  }

  private messageRTC$(): Observable<any> {
    return this._socket.listen('peer-message');
  }

  private handleRTCPeerMessage(message: any) {

    const peerConnection = this.getPeerConnection(message.by);

    switch ( message.type ) {
      case RTC_PEER_MESSAGE_SDP_OFFER:
        peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp)).then(() => {
          console.log('Setting remote description by offer');
          peerConnection.createAnswer().then(sdp => {
            peerConnection.setLocalDescription(sdp).then(() => {
              this.messageRTC({
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

    console.log('creating RTCPeerConnection', {id, local: this._socket.id});

    // creates RTCPeerConnection object
    const peerConnection = new RTCPeerConnection(RTC_PEER_CONFIG);
    this._peerConnections[id] = peerConnection;

    // adds my tracks
    this._myStream.getValue().getTracks().forEach(track => {
      peerConnection.addTrack(track, this._myStream.getValue());
    });

    // received track
    peerConnection.ontrack = (event: RTCTrackEvent) => {
      this._room.addRoomie({id, stream: event.streams[0]});
    };

    // sends ice candidates
    peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        this.messageRTC({to: id, ice: event.candidate, type: RTC_PEER_MESSAGE_ICE});
      }
    };

    peerConnection.onnegotiationneeded = () => {
      console.log('Need negotiation:', id);
      peerConnection.createOffer().then(offer => {
        peerConnection.setLocalDescription(offer).then(() => {
          offer.sdp = setMediaBitrate(offer.sdp, 'video', 200);
          offer.sdp = setMediaBitrate(offer.sdp, 'audio', 30);
          this.messageRTC({to: id, sdp: offer, type: RTC_PEER_MESSAGE_SDP_OFFER});
        });
      });
    };

    peerConnection.onsignalingstatechange = () => {
      console.log('ICE signaling state changed to:', peerConnection.signalingState, 'for client', id);
    };

    return peerConnection;
  }

}
