import { Injectable } from '@angular/core';
import { Observable,  merge, Subject } from 'rxjs';
import { RoomService } from './room.service';
import { VideoService } from './video.service';
import { take, switchMap, tap, filter } from 'rxjs/operators';

export const RTC_PEER_MESSAGE_SDP_OFFER = 'sdp-offer';
export const RTC_PEER_MESSAGE_SDP_ANSWER = 'sdp-answer';
export const RTC_PEER_MESSAGE_ICE = 'ice';
export const RTC_PEER_CONFIG =
{iceServers:
  [
    {urls: 'stun:stun.l.google.com:19302'},
    {urls: 'stun:stun1.l.google.com:19302'},
    {urls: 'stun:stun2.l.google.com:19302'},
    {urls: 'stun:stun3.l.google.com:19302'},
    {urls: 'stun:stun4.l.google.com:19302'}
  ]
};

@Injectable({
  providedIn: 'root'
})
export class WebrtcService {

  private myMediaStream: MediaStream = undefined;
  private peerConnections: RTCPeerConnection[] = [];
  private initialized$ = new Subject<void>();

  constructor(
    private _room: RoomService,
    private _videoSrv: VideoService
  ) {

    this.initialized$.pipe(
      switchMap(() => this._room.messageRTC$())
    ).subscribe(data => {
      this.handleRTCPeerMessage(data);
    });

    this.initialized$
      .pipe(
        switchMap(() => this._room.myRoomies$()),
        filter(users => users !== null),
        switchMap(users => {
          const observables = users.map(id => {
            return this.makeOffer$(id).pipe(
              tap(sdp => {
              this._room.messageRTC({
                to: id,
                sdp,
                type: RTC_PEER_MESSAGE_SDP_OFFER
              });
            }));
          });
          return merge(...observables);
        })
      )
      .subscribe();

  }

  makeOffer$(id: string): Observable<RTCSessionDescriptionInit> {
    return new Observable((subscriber) => {
      const peerConnection = this.getPeerConnection(id);
      const options = {
          offerToReceiveVideo: true,
          offerToReceiveAudio: true
      };
      peerConnection
      .createOffer(options)
      .then((sdp: RTCSessionDescriptionInit) => {
        peerConnection
          .setLocalDescription(sdp)
          .then(() => {
            subscriber.next(sdp);
          });
      });
    });
  }

  connectToRoom() {
    this._videoSrv.AudioAndVideoStream$
      .pipe(take(1))
      .subscribe((stream) => {
        this.myMediaStream = stream;
        this._room.addMe(this.myMediaStream);
        this.initialized$.next();
      });
  }

  private handleRTCPeerMessage(message) {

    const peerConnection = this.getPeerConnection(message.by);

    switch ( message.type ) {
      case RTC_PEER_MESSAGE_SDP_OFFER:
        peerConnection
          .setRemoteDescription(new RTCSessionDescription(message.sdp))
          .then(() => {
            console.log('Setting remote description by offer');
            peerConnection
              .createAnswer()
              .then((sdp: RTCSessionDescriptionInit) => {
                peerConnection.setLocalDescription(sdp)
                  .then(() => {
                    this._room.messageRTC({
                      to: message.by,
                      sdp,
                      type: RTC_PEER_MESSAGE_SDP_ANSWER
                    });
                  });
              });
          })
          .catch(err => {
            console.error('Error on SDP-Offer:', err);
          });
        break;
      case RTC_PEER_MESSAGE_SDP_ANSWER:
        peerConnection
          .setRemoteDescription(new RTCSessionDescription(message.sdp))
          .then(() => console.log('Setting remote description by answer'))
          .catch(err => console.error('Error on SDP-Answer:', err));
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
    if (this.peerConnections[id]) {
      return this.peerConnections[id];
    }

    const peerConnection = new RTCPeerConnection(RTC_PEER_CONFIG);
    this.peerConnections[id] = peerConnection;

    peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      this._room.messageRTC({
        to: id,
        ice: event.candidate,
        type: RTC_PEER_MESSAGE_ICE
      });
    };

    peerConnection.onnegotiationneeded = () => {
      console.log('Need negotiation:', id);
    };

    peerConnection.onsignalingstatechange = () => {
      console.log('ICE signaling state changed to:', peerConnection.signalingState, 'for client', id);
    };


    peerConnection.addTrack(this.myMediaStream.getVideoTracks()[0], this.myMediaStream);
    peerConnection.ontrack = (event: RTCTrackEvent) => {
      this._room.addRoomie({id, stream: event.streams[0]});
    };


    return peerConnection;
  }

}
