import { Injectable } from '@angular/core';
import { SocketioService } from '@core/services/socket.io/socket.io.service';
import { forkJoin, Observable } from 'rxjs';
import { mergeMap, tap, take } from 'rxjs/operators';
import { RoomEvent } from '../../../room/models/roomUserJoin';
import { RoomService } from '../../../room/services/room.service';
import { StreamService } from '../stream/stream.service';
import { WebRTCPeerConfig } from './models/webRTC.config';
import { WebRTCPeerMessage } from './models/webRTC.messages';
import { setMediaBitrate } from './utils/webRTC.utils';

@Injectable({
  providedIn: 'root'
})
export class WebRTCService {

  private myStream: MediaStream = null;
  private _peerConnections: Map<string, RTCPeerConnection> = new Map();
  private _userJoined$: Observable<RoomEvent>;
  private _userLeft$: Observable<RoomEvent>;
  private _listenRTCMessages$: Observable<any>;

  constructor(
    private _room: RoomService,
    private _socket: SocketioService,
    private _videoSrv: StreamService
  ) {
    this._userJoined$ = this._room.userJoined$().pipe(
      tap(data => {
        this.sendOffer(this.getPeerConnection(data.id), data.id);
      })
    );
    this._userLeft$ = this._room.userLeft$().pipe(
      tap(data => {
        this._room.deleteRoomie(data.id);
        this._peerConnections.get(data.id).close();
        this._peerConnections.set(data.id, null);
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
      take(1),
      tap(stream => this.myStream = stream),
      mergeMap(() => forkJoin([
        this._userJoined$,
        this._userLeft$,
        this._listenRTCMessages$
      ])),
    ).subscribe();
  }

  addTrack(stream: MediaStream) {
    this._peerConnections.forEach((peer, id) => {
      stream.getTracks().forEach(track => {
        peer.addTrack(track, stream);
      });
      this.sendOffer(peer, id);
    });
  }

  clear() {
    this._peerConnections.forEach((peer, id) => {
      this._room.deleteRoomie(id);
      peer.close();
      peer = null;
      this._peerConnections.delete(id);
    });
    this._peerConnections.clear();
  }

  private messageRTC(data: any): void {
    this._socket.emit('peer-message', data);
  }

  private messageRTC$(): Observable<any> {
    return this._socket.listen$('peer-message');
  }

  private handleRTCPeerMessage(message: any): void {

    const peerConnection = this.getPeerConnection(message.by);

    switch ( message.type ) {
      case WebRTCPeerMessage.SDP_OFFER:
        console.log(message.by);
        peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp)).then(() => {
          console.log('<--- Setting remote description by offer');
          this.sendAnswer(peerConnection, message.by);
        }).catch(err => {console.error('Error on SDP-Offer:', err); });
        break;

      case WebRTCPeerMessage.SDP_ANSWER:
        peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp)).then(() =>
          console.log('<--- Setting remote description by answer')
        ).catch(err => {
          console.error('Error on SDP-Answer:', err);
        });
        break;

      case WebRTCPeerMessage.ICE:
        console.log('<--- Adding ice candidate');
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
    const peerConnection = new RTCPeerConnection(WebRTCPeerConfig.configuration);
    this._peerConnections.set(id, peerConnection);

    // received track
    peerConnection.ontrack = (event: RTCTrackEvent) => {
      console.log(event.streams);
      this._room.addRoomie({id, stream: event.streams[0]});
    };

    // sends ice candidates
    peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        this.messageRTC({to: id, ice: event.candidate, type: WebRTCPeerMessage.ICE});
      }
    };

    // adds my tracks
    this.myStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, this.myStream);
    });

    peerConnection.onnegotiationneeded = () => {
      console.log('Need negotiation:', id);
    };

    peerConnection.onsignalingstatechange = () => {
      console.log('ICE signaling state changed to:', peerConnection.signalingState, 'for client', id);
    };

    return peerConnection;
  }

  private sendOffer(peer: RTCPeerConnection, to: string): void {
    console.log('%c---> sending offer to', 'color: green; font-weight: bold;', to);
    peer.createOffer().then(offer => {
      peer.setLocalDescription(offer).then(() => {
        offer.sdp = setMediaBitrate(offer.sdp, 'video', WebRTCPeerConfig.videoBitrate);
        offer.sdp = setMediaBitrate(offer.sdp, 'audio', WebRTCPeerConfig.audioBitrate);
        this.messageRTC({to, sdp: offer, type: WebRTCPeerMessage.SDP_OFFER});
      });
    });
  }

  private sendAnswer(peer: RTCPeerConnection, to: string): void {
    console.log('%c---> sending answer to', 'color: green; font-weight: bold;', to);
    peer.createAnswer().then(sdp => {
      peer.setLocalDescription(sdp).then(() => {
        this.messageRTC({
          to, sdp, type: WebRTCPeerMessage.SDP_ANSWER
        });
      });
    });
  }

}
