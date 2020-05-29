import React, { useRef, useEffect } from "react";

import "./App.css";

function App() {
  
  const bob = new RTCPeerConnection();
  const alice = new RTCPeerConnection();

  useEffect(() => {

    bob.onicecandidate = (e) => {
      console.log("bob sending ICE candidate", e);
      if(e.candidate){
        ICEToAlice(e.candidate)
      }
    }

    alice.onicecandidate = (e) => {
      console.log("alice sending ICE candidate", e)
      if(e.candidate){
        ICEToBob(e.candidate)
      }
    }

    alice.ontrack = (track) => {
      aliceRemoteVideo.current.srcObject = track.streams[0]
    }

    bob.ontrack = (track) => {
      bobRemoteVideo.current.srcObject = track.streams[0]
    }

  })


  const bobCreateOffer = () => {
    bob.createOffer({offerToReceiveVideo: true})
      .then(rtcSDP => {
        bob.setLocalDescription(rtcSDP)
        offerToAlice(rtcSDP)
      })
  }

  const offerToAlice = (rtcSDP) => {
    console.log("alice got offer", rtcSDP);
    alice.setRemoteDescription(new RTCSessionDescription(rtcSDP))
  }

  const aliceCreateAnswer = () => {
    alice.createAnswer({offerToReceiveVideo: true})
      .then(rtcSDP => {
        alice.setLocalDescription(rtcSDP)
        answerToBob(rtcSDP);
      })
  }

  const answerToBob = (rtcSDP) => {
    console.log("bob got answer", rtcSDP)
    bob.setRemoteDescription(new RTCSessionDescription(rtcSDP))
  }

  const ICEToAlice = (ICECandidate) => {
    alice.addIceCandidate(new RTCIceCandidate(ICECandidate))
  }

  const ICEToBob = (ICECandidate) => {
    bob.addIceCandidate(new RTCIceCandidate(ICECandidate))
  }

  const bobFetchScreen = () => {
    navigator.mediaDevices
      .getDisplayMedia()
      .then(medStream => {
        bobLocalVideo.current.srcObject = medStream;
        medStream.getTracks().forEach(track => {bob.addTrack(track, medStream)});
      })
      .catch((e) => console.log("Error: ", e))

  }

  const aliceFetchScreen = () => {
    console.log(navigator.mediaDevices.getSupportedConstraints())
    navigator.mediaDevices
      .getDisplayMedia()
      .then(medStream => {
        aliceLocalVideo.current.srcObject = medStream;
        medStream.getTracks().forEach(track => {
          alice.addTrack(track, medStream)})
      })
      .catch((e) => console.log("Error: ", e))

  }

  const bobLocalVideo = useRef();
  const bobRemoteVideo = useRef();
  const aliceLocalVideo = useRef();
  const aliceRemoteVideo = useRef();

  const videoStyle = {
    width: 256,
    height: 144,
    margin: 5,
    backgroundColor: 'black'
  }

  return (
    <div className="App">
      <h1>WebRTC Media sharing</h1>
      <div className="VideoContainer">
        <video className="Video" style={videoStyle} ref={bobLocalVideo} autoPlay></video>
        <p>Bob local video</p>
      </div>
      <div className="VideoContainer">
        <video className="Video" style={videoStyle} ref={bobRemoteVideo} autoPlay></video>
        <p>Bob remote video</p>
      </div>
      <br/>
      <button onClick={bobFetchScreen}>Bob get media</button>
      <button onClick={bobCreateOffer}>Bob offers</button>
      <hr/>
      <div className="VideoContainer">
      <video className="Video" style={videoStyle} ref={aliceLocalVideo} autoPlay></video>
        <p>Alice local video</p>
      </div>
      <div className="VideoContainer">
        <video className="Video" style={videoStyle} ref={aliceRemoteVideo} autoPlay></video>
        <p>Alice remote video</p>
      </div>
      <br/>
      <button onClick={aliceFetchScreen}>Alice get media</button>
      <button onClick={aliceCreateAnswer}>Alice answers</button>
    </div>
  );
}

export default App;
