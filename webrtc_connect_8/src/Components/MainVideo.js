import React, { useRef, useEffect, useState } from "react";
import io from "socket.io-client";
import "./../App.css";
import Video from "./video";
import 'webrtc-adapter';

const pc_config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const backend = "https://agile-headland-95579.herokuapp.com/";
let prev, socket, callRemote, localStream, pc;
let lid, isOffering;
let peerConnections = {};

const MainVideo = (props) => {
  const { loginName, room, peersInRoom, setPeersInRoom } = props
  const [remoteVideos, setRemoteVideos] = useState([]);
  const [isDisplaying, setIsDisplaying] = useState(false);
  const [users, setUsers] = useState({})

  useEffect(() => {
    socket = io(backend);

    socket.on("connect", () => {
      console.log("connected", loginName, room);
      socket.emit("name-and-room", {name: loginName, room: room})
    });
    socket.on("localID", (socketid) => {
      lid = socketid;
    });
    socket.on("name-update", data => {
      setUsers(data)
      let arr = [];
      Object.entries(data).forEach(elem => {
        arr.push(elem[1].name)
      })
      setPeersInRoom(data);
    })

    //

    const senderFunction = (message, data) => {
      socket.emit(message, data);
    };

    const pcFactory = (pc, remoteid) => {

      pc.onnegotiationneeded = async () => {
        console.log("negotiationneeded");
        isOffering = true;
        await pc.setLocalDescription(pc.createOffer());

        if (pc.localDescription) {
          console.log("sending offer", pc.localDescription);
          senderFunction("payload", {
            payload: pc.localDescription,
            remoteid: lid,
            target: remoteid,
            type: "offer",
          });
        }
        isOffering = false;
      };


      pc.onicecandidate = (e) => {
        if (e && e.candidate) {
          senderFunction("payload", {
            payload: e.candidate,
            type: "ice",
            remoteid: lid,
            target: remoteid,
          });
        }
      };

      pc.oniceconnectionstatechange = (event) => {
        if (pc.iceConnectionState === "failed") {
          pc.restartIce();
        }
      };

      pc.ontrack = async (track) => {
        console.log("track", track)
        track.track.onunmute = async () => { 
        await setRemoteVideos((remoteVideos) => remoteVideos.filter((stream) => !(stream.socketid === remoteid)));
        await setRemoteVideos((remoteVideos) => [...remoteVideos, { socketid: remoteid, video: track.streams[0] }]);
        }
      };

      if (localStream) {
        console.log("stream", localStream);
        localStream
          .getTracks()
          .forEach((track) => pc.addTrack(track, localStream));
      }
      peerConnections[remoteid] = pc;

      return pc;
    };

    callRemote = () => {
      navigator.mediaDevices.getDisplayMedia().then((stream) => {
        if(localStream)
        localStream.getTracks().forEach(track => {track.stop()});
        if(localVideo && localVideo.current.srcObject)
        localVideo.current.srcObject.getTracks().forEach(track => track.stop)
        stream.oninactive = (e) => {
          console.log("inactive", e)
          setIsDisplaying(false)
        }
        localVideo.current.srcObject = stream;
        localStream = stream;
        socket.emit("active-sender");
        setIsDisplaying(true);
      });
      
    };

    //

    socket.on("want-to-watch", async (socketid) => {
      let pc;
      if(!peerConnections[socketid]){
      console.log("creating");
      pc = await pcFactory(new RTCPeerConnection(pc_config), socketid);
      console.log("want to watch from", socketid);
      peerConnections[socketid] = pc;
      } else {
        console.log("not creating")
        pc = peerConnections[socketid];
        if(localStream){
        localStream.getTracks().forEach(track => track.enabled = true)
        localStream.getTracks().forEach(track => {
          try {
          pc.addTrack(track, localStream)
          } catch (e) {
            console.log(e);
          }
        })
      }
      }

    });

    socket.on("payload", async (data) => {
      if (!peerConnections[data.remoteid]) {
        pc = await pcFactory(new RTCPeerConnection(pc_config), data.remoteid);
        peerConnections[data.remoteid] = pc;
      } else {
        pc = peerConnections[data.remoteid];
      }

      if (data.type === "offer") {
        if (lid > data.remoteid && (isOffering || pc.signalingState != "stable")) {
          return;
        }

        await pc.setRemoteDescription(data.payload);
        await pc.setLocalDescription();
        console.log("sending answer", pc.localDescription, lid);
        senderFunction("payload", {
          payload: pc.localDescription,
          remoteid: lid,
          type: "answer",
          target: data.remoteid,
        });
      }

      if (data.type === "answer") {
        console.log("got answer", data);
        pc.setRemoteDescription(new RTCSessionDescription(data.payload));
      }

      if (data.type === "ice") {
        pc.addIceCandidate(new RTCIceCandidate(data.payload));
      }
    });

    socket.on("call-started", () => {
      console.log("call started");
      socket.emit("want-to-watch");
    });

    socket.on("hangup", sdp => {
      console.log("hung up")
    })

    socket.on("peer-left", (socketid) => {
      setRemoteVideos((remoteVideos) =>
        remoteVideos.filter((stream) => stream.socketid != socketid)
      );
    });
  }, []);

  const hangUp = () => {
    socket.emit("hangup");
    localVideo.current.srcObject.getTracks()[0].enabled = false;
    setIsDisplaying(false)
  };


  //
  const localVideo = useRef();
  const remoteVideo = useRef();

  const videoStyle = {
    width: "100%",
    height: "auto",
    margin: 5,
    backgroundColor: "black",
  };

  return (
    <div className="App">
      <h1>WebRTC Media sharing</h1>
      <h3>Rum: "{room}"</h3>
      <div className="VideoContainer">
        <video
          className="Video"
          style={videoStyle}
          ref={localVideo}
          autoPlay
        ></video>
        <p>Din egen bild du visar</p>
      </div>
      <br />
      {isDisplaying 
      ? 
      <button class="btn btn-warning" onClick={() => hangUp()}>Pausa</button>
      :
      <button class="btn btn-primary" onClick={() => callRemote()}>Share my Screen</button>
      }
      <hr></hr>
      {remoteVideos.map((stream, index) => (
        <Video key={index} stream={stream} style={videoStyle} users={users} pcs={peerConnections} />
      ))}
    </div>
  );
}

export default MainVideo;
