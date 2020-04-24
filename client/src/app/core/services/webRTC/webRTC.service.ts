import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { switchMap, tap, take, filter, map } from 'rxjs/operators';
import { SocketioService } from 'src/app/core/services/socket.io/socket.io.service';
import { RoomEvent } from '../../../room/models/roomUserJoin';
import { RoomService } from '../../../room/services/room.service';
import { StreamService } from '../stream/stream.service';
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
  private _peerConnections: Map<string, RTCPeerConnection> = new Map();;
  private _userJoined$: Observable<RoomEvent>;
  private _userLeft$: Observable<RoomEvent>;
  private _roomReady$: Observable<string[]>;
  private _listenRTCMessages$: Observable<any>;

  constructor(
    private _room: RoomService,
    private _socket: SocketioService,
    private _videoSrv: StreamService
  ) {
    this._roomReady$ = this._room.users$.pipe(
      filter(users => users.filter(id => id !== this._socket.id).length > 0),
      map(users => users.filter(id => id !== this._socket.id)),
      take(1),
      tap(data => {
        console.log('ready');
        data.forEach(id => {
          this.getPeerConnection(id);
        });
      })
    );
    this._userJoined$ = this._room.userJoined$().pipe(
      tap(data => this.getPeerConnection(data.id))
    );
    this._userLeft$ = this._room.userLeft$().pipe(
      tap(data => {
        this._room.deleteRoomie(data.id);
        this._peerConnections.get(data.id).close();
        this._peerConnections.delete(data.id);
      })
    );
    this._listenRTCMessages$ = this.messageRTC$().pipe(
      tap(data => this.handleRTCPeerMessage(data))
    );
  }

  start() {
    this._videoSrv.stream$
    .pipe(
      tap(console.log),
      filter(stream => stream != null),
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

    const alreadyExists = this._peerConnections.has(message.by);
    const peerConnection = this.getPeerConnection(message.by);

    switch ( message.type ) {
      case RTC_PEER_MESSAGE_SDP_OFFER:
        peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp)).then(() => {
          console.log('Setting remote description by offer');
          this.sendAnswer(peerConnection, message.by);
        }).catch(err => {console.error('Error on SDP-Offer:', err); });
        break;

      case RTC_PEER_MESSAGE_SDP_ANSWER:
        peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp)).then(() =>
          console.log('Setting remote description by answer')
        ).catch(err => {
          console.error('Error on SDP-Answer:', err);
        });
        break;

      case RTC_PEER_MESSAGE_ICE:
        console.log('Adding ice candidate');
        peerConnection.addIceCandidate(new RTCIceCandidate(message.ice));
        break;
    }
  }

  private getPeerConnection(id: string): RTCPeerConnection {

    if (this._peerConnections.has(id)) {
      return this._peerConnections.get(id);
    }

    console.log('creating RTCPeerConnection', {id, local: this._socket.id});

    // creates RTCPeerConnection object
    const peerConnection = new RTCPeerConnection(RTC_PEER_CONFIG);
    this._peerConnections.set(id, peerConnection);

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
      this.sendOffer(peerConnection, id);
    };

    peerConnection.onsignalingstatechange = () => {
      console.log('ICE signaling state changed to:', peerConnection.signalingState, 'for client', id);
    };

    return peerConnection;
  }

  private sendOffer(peer: RTCPeerConnection, to: string): void {
    console.log('%csending offer to', 'color: green; font-weight: bold;', to);
    peer.createOffer().then(offer => {
      peer.setLocalDescription(offer).then(() => {
        offer.sdp = setMediaBitrate(offer.sdp, 'video', 200);
        offer.sdp = setMediaBitrate(offer.sdp, 'audio', 30);
        this.messageRTC({to, sdp: offer, type: RTC_PEER_MESSAGE_SDP_OFFER});
      });
    });
  }

  private sendAnswer(peer: RTCPeerConnection, to: string) {
    console.log('%csending answer to', 'color: green; font-weight: bold;', to);
    peer.createAnswer().then(sdp => {
      peer.setLocalDescription(sdp).then(() => {
        this.messageRTC({
          to, sdp, type: RTC_PEER_MESSAGE_SDP_ANSWER
        });
      });
    });
  }

}
