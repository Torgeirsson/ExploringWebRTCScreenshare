import React, { useEffect, useRef, useState } from "react";
import Stats from './Stats'

const Video = (props) => {

  const { stream, style, users, pcs } = props;
  const [name, setName] = useState("")
  const [show, setShow] = useState(true)

    

  useEffect(() => {
    videoRef.current.srcObject = stream.video;
    videoRef.current.controls = true;
    setName(users.filter(elem => elem[0] == stream.socketid)[0][1].name)
  }, [name]);

  const videoRef = useRef();

  return (
    <div className={show ? "visibile" : "invisible" } >
      <h1>Video från {name}</h1>
      <video ref={videoRef} style={style} autoPlay={true}></video>
      <Stats pcs={pcs} id={stream.socketid}></Stats>
    </div>
  );
};




export default Video;
