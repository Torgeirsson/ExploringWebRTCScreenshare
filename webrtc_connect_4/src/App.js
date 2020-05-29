import React, { useRef, useEffect, useState } from "react";

import "./App.css";

const bob = new RTCPeerConnection();
const alice = new RTCPeerConnection();

function App() {
  let prev;
  const [bobStream, setBobStream] = useState(undefined);
  const [bobOffer, setBobOffer] = useState(false);
  const [bitrate, setBitrate] = useState(0);
  const [sender, setSender] = useState();
  const bobIsPolite = false;
  const aliceIsPolite = true;

  useEffect(() => {
    console.log("useEffect");
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
      await setBobOffer(true);
      await bob.setLocalDescription(await bob.createOffer());
      offerToAlice(bob.localDescription);
      await setBobOffer(false);
    };

    alice.onnegotiationneeded = async () => {
      await alice.setLocalDescription(await alice.createOffer());
      offerToBob(alice.localDescription);
    };
  }, []);

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
    if (!bobIsPolite && (bobOffer || bob.signalingState !== "stable")) {
      return;
    }

    await bob.setRemoteDescription(SDP);
    await bob.setLocalDescription();
    answerToAlice(bob.localDescription);
  };

  const answerToBob = (SDP) => {
    console.log("bob got answer", SDP);
    bob.setRemoteDescription(new RTCSessionDescription(SDP));
  };

  const answerToAlice = (SDP) => {
    console.log("Alice got answer", SDP);
    alice.setRemoteDescription(new RTCSessionDescription(SDP));
  };

  const bobGetMedia = () => {
    console.log("bobstream:", bobStream);
    if (bobStream) {
      bobStream.getTracks().forEach((track) => {
        track.stop();
        console.log("stopping", track);
      });
    }
    navigator.mediaDevices
      .getDisplayMedia()
      .then((medStream) => {
        setBobStream(medStream);
        bobLocalVideo.current.srcObject = medStream;
        medStream.getTracks().forEach((track) => {
          bob.addTrack(track, medStream);
        });
      })
      .catch((e) => console.log("Error: ", e));
  };

  const aliceGetMedia = () => {
    console.log(navigator.mediaDevices.getSupportedConstraints());
    const constraints = {
      video: {
        width: {max: 1000, ideal: 500},
        frameRate: 30
      },
      audio: true,
    };

    navigator.mediaDevices
      .getDisplayMedia(constraints)
      .then(async (medStream) => {
        aliceLocalVideo.current.srcObject = medStream;
        medStream.getTracks().forEach((track) => {
          console.log(track.getCapabilities())
          console.log(track.getSettings())
          track.applyConstraints({frameRate: 4})
            .then(() => console.log(track.getSettings()))

          let sd = alice.addTrack(track, medStream);
          setSender(sd);
        });
      })
      .catch((e) => console.log("Error: ", e));
  };

  const useInterval = (callback, delay) => {
    const savedCallback = useRef();

    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
      function tick() {
        savedCallback.current();
      }
      if (delay !== null) {
        let id = setInterval(tick, delay);
        return () => clearInterval(id);
      }
    }, [delay]);
  };

  useInterval(() => {
    if (!alice || !sender) {
      return;
    }
    sender.getStats().then((statsReport) => {
      statsReport.forEach((stat) => {
        if (stat.type === "outbound-rtp") {
          if (prev && prev.has(stat.id)) {
            const timeDifference =
              (stat.timestamp - prev.get(stat.id).timestamp) / 1000;
            const btr =
              (8 * (stat.bytesSent - prev.get(stat.id).bytesSent)) /
              timeDifference /
              100000;
            setBitrate(btr.toFixed(2));
          }
        }
      });
      prev = statsReport;
    });
  }, 100);

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
      <p>Alice outgoing bitrate: {bitrate} mbits/s</p>
    </div>
  );
}

export default App;
