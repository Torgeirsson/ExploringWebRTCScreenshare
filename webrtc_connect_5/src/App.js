import React, { useRef, useEffect, useState } from "react";
import io from "socket.io-client";
import "./App.css";

const pc = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
});
let prev, socket, callRemote;

function App() {
  const [bitrate, setBitrate] = useState(0);
  const [sender, setSender] = useState();
  const [isPolite, setIsPolite] = useState(false);
  const [isOffering, setIsOffering] = useState(false);
  const PORT = "localhost:5000";

  useEffect(() => {
    callRemote = () => {
      navigator.mediaDevices.getDisplayMedia().then((stream) => {
        console.log("Stream", stream);
        localVideo.current.srcObject = stream;
        stream.getTracks().forEach((track) => {
          let sd = pc.addTrack(track, stream);
          setSender(() => sd);
        });
      });
    };
  }, []);

  useEffect(() => {
    console.log("runs")
    socket = io(PORT);
    socket.on("connect", () => {
      console.log("connected");
      senderFunction("new-connection", "hurra");
    });
    socket.on("polite-answer", (answer) => {
      console.log(answer);
      setIsPolite(answer);
    });

    const senderFunction = (message, data) => {
      socket.emit(message, data);
    };

    pc.onicecandidate = (e) => {
      if (e && e.candidate) {
        console.log("sending ice-candidate", e);
        senderFunction("ice", e.candidate);
      }
    };

    pc.ontrack = (track) => {
      console.log("track", track)
      remoteVideo.current.srcObject = track.streams[0];
    };

    //

    pc.onnegotiationneeded = async () => {
      setIsOffering(true);
      await pc.setLocalDescription(await pc.createOffer());
      senderFunction("offer", pc.localDescription);
      setIsOffering(false);
    };

    pc.oniceconnectionstatechange = () => {
      if(pc.iceConnectionState === "failed"){
        console.log("restarts ice")
        pc.restartIce();
      }
    }

    socket.on("offer", async (sdp) => {
      console.log("got offer", sdp);
      if (!isPolite && (isOffering || pc.signalingState !== "stable")) {
        return;
      }

      await pc.setRemoteDescription(sdp);
      await pc.setLocalDescription();
      console.log("answers")
      senderFunction("answer", pc.localDescription);
    });

    socket.on("answer", (sdp) => {
      console.log("got answer", sdp);
      pc.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    socket.on("ice", (ICECandidate) => {
      console.log("got ICE-candidate", ICECandidate);
      pc.addIceCandidate(new RTCIceCandidate(ICECandidate.candidate));
    });

    socket.on("forced-disconnect", message => {
      console.log(message)
    })

  }, []);

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
    if (!pc || !sender) {
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
            setBitrate(() => btr.toFixed(2));
          }
        }
      });
      prev = statsReport;
    });
  }, 1000);

  const localVideo = useRef();
  const remoteVideo = useRef();

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
          ref={localVideo}
          autoPlay
        ></video>
        <p>Local video</p>
      </div>
      <div className="VideoContainer">
        <video
          className="Video"
          style={videoStyle}
          ref={remoteVideo}
          autoPlay
        ></video>
        <p>Remote video</p>
      </div>
      <br />
      <button onClick={() => callRemote()}>Share my Screen</button>
      <p>Outgoing bitrate: {bitrate} mbits/s</p>
      <p>Is polite: {isPolite ? "Ja" : "Nej"}</p>
    </div>
  );
}

export default App;
