import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Components/Sidebar.css";
import MainVideo from "./Components/MainVideo"
import Sidebar from "./Components/Sidebar";
import Navbar from "./Components/Navbar";
import Login from "./Components/Login";


const App = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [peersInRoom, setPeersInRoom] = useState([])


  return (
    <div className="container-fluid">
      <Navbar></Navbar>
      <div className="row">
        <div id="sidebar-wrapper" className="col-2">
          <Sidebar
          peersInRoom={peersInRoom}
          ></Sidebar>
        </div>
        <div id="content-wrapper" className="col-7">
          <div id="main-area" className="container-fluid">
            {loggedIn ? (
              <MainVideo
                loginName={name}
                room={room}
                peersInRoom={peersInRoom}
                setPeersInRoom={setPeersInRoom}
              ></MainVideo>
            ) : (
              <Login
                setLoggedIn={setLoggedIn}
                setName={setName}
                setRoom={setRoom}
              ></Login>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;