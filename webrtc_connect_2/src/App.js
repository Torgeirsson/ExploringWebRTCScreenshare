import React, { useRef, useEffect, useState } from "react";

import "./App.css";

function App() {
  const bob = new RTCPeerConnection();
  const alice = new RTCPeerConnection();
  let aliceStream;
  let aliceSender;
  let bobSender;
  const [bobStream, setBobStream] = useState(undefined)
  const [bobOffer, setBobOffer] = useState(false)
  const bobIsPolite = false;
  const aliceIsPolite = true;

  useEffect(() => {
    bob.onicecandidate = (e) => {
      console.log("bob onice", e);
      if (e.candidate) {
        ICEToAlice(e);
      }
    };

    alice.onicecandidate = (e) => {
      console.log("alice onice", e);
      if (e.candidate) {
        ICEToBob(e);
      }
    };

    const ICEToAlice = (ICECandidate) => {
      alice.addIceCandidate(new RTCIceCandidate(ICECandidate.candidate));
    };

    const ICEToBob = (ICECandidateEvenet) => {
      bob.addIceCandidate(new RTCIceCandidate(ICECandidateEvenet.candidate));
    };

    alice.ontrack = (medStream) => {
      aliceRemoteVideo.current.srcObject = medStream.streams[0];
    };

    bob.ontrack = (medStream) => {
      console.log("bob ontrack");
      bobRemoteVideo.current.srcObject = medStream.streams[0];
    };

    bob.onnegotiationneeded = async () => {
      await setBobOffer(true)
      await bob.setLocalDescription(await bob.createOffer());
      offerToAlice(bob.localDescription);
      await setBobOffer(false)
    };

    alice.onnegotiationneeded = async () => {
      await alice.setLocalDescription(await alice.createOffer());
      offerToBob(alice.localDescription);
    };
  });

  // const bobCreateOffer = () => {
  //   bob.createOffer({offerToReceiveVideo: true})
  //     .then(SDP => {
  //       bob.setLocalDescription(SDP)
  //       offerToAlice(SDP)
  //     })
  // }


  //Old
  const offerToAlice = async (SDP) => {
    console.log("alice got offer", SDP);
    console.log(SDP.type);
    if (alice.signalingState !== "stable") {
      if (!aliceIsPolite) {
        return;
      }

      await Promise.all([
        alice.setLocalDescription({ type: "rollback" }),
        alice.setRemoteDescription(SDP),
      ]);
    } else {
      await alice.setRemoteDescription(SDP);
    }
    await alice.setLocalDescription(await alice.createAnswer());
    answerToBob(alice.localDescription);
  };

  //New
  const offerToBob = async (SDP) => {
    console.log("bob got offer", SDP);
    if(!bobIsPolite && (bobOffer || bob.signalingState !== "stable")){
      return;
    }

    await bob.setRemoteDescription(SDP);
    await bob.setLocalDescription();
    answerToAlice(bob.localDescription);
  };

  // const aliceCreateAnswer = () => {
  //   alice.createAnswer({offerToReceiveVideo: true})
  //     .then(rtcSDP => {
  //       alice.setLocalDescription(rtcSDP)
  //       answerToBob(rtcSDP);
  //     })
  // }

  const answerToBob = (SDP) => {
    console.log("bob got answer", SDP);
    bob.setRemoteDescription(new RTCSessionDescription(SDP));
  };

  const answerToAlice = (SDP) => {
    console.log("Alice got answer", SDP);
    alice.setRemoteDescription(new RTCSessionDescription(SDP));
  };

  const bobGetMedia = () => {
    console.log("bobstream:", bobStream)
    if(bobStream){
    bobStream.getTracks().forEach(track => {
      track.stop()
      console.log("stopping", track)
      })
    }
    navigator.mediaDevices
      .getDisplayMedia()
      .then((medStream) => {
        setBobStream(medStream)
        bobLocalVideo.current.srcObject = medStream;
        medStream.getTracks().forEach((track) => {
          bobSender = bob.addTrack(track, medStream);
        });
      })
      .catch((e) => console.log("Error: ", e));
  };

  const aliceGetMedia = () => {
    navigator.mediaDevices
      .getDisplayMedia()
      .then((medStream) => {
        aliceStream = medStream;
        aliceLocalVideo.current.srcObject = medStream;
        medStream.getTracks().forEach((track) => {
          aliceSender = alice.addTrack(track, medStream);
        });
      })
      .catch((e) => console.log("Error: ", e));
  };

  const aliceHangsUp = async () => {
    console.log("aliceSender", aliceSender);
    aliceStream.getTracks().forEach((track) => track.stop());
    await alice.removeTrack(aliceSender);
    console.log(alice.getSenders());
  };

  const bobLocalVideo = useRef();
  const bobRemoteVideo = useRef();
  const aliceLocalVideo = useRef();
  const aliceRemoteVideo = useRef();

  const videoStyle = {
    width: 256,
    height: 144,
    margin: 5,
    backgroundColor: "black",
  };

  return (
    <div className="App">
      <h1>WebRTC Media sharing</h1>
      <div className="VideoContainer">
        <video
          className="Video"
          style={videoStyle}
          ref={bobLocalVideo}
          autoPlay
        ></video>
        <p>Bob local video</p>
      </div>
      <div className="VideoContainer">
        <video
          className="Video"
          style={videoStyle}
          ref={bobRemoteVideo}
          autoPlay
        ></video>
        <p>Bob remote video</p>
      </div>
      <br />
      <button onClick={bobGetMedia}>Bob get media</button>
      <hr />
      <div className="VideoContainer">
        <video
          className="Video"
          style={videoStyle}
          ref={aliceLocalVideo}
          autoPlay
        ></video>
        <p>Alice local video</p>
      </div>
      <div className="VideoContainer">
        <video
          className="Video"
          style={videoStyle}
          ref={aliceRemoteVideo}
          autoPlay
        ></video>
        <p>Alice remote video</p>
      </div>
      <br />
      <button onClick={aliceGetMedia}>Alice get media</button>
      <button onClick={aliceHangsUp}>Alice hangs up</button>
    </div>
  );
}

export default App;
