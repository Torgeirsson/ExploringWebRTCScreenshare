import React, { useState } from "react";

const Login = (props) => {
  const { setLoggedIn, setName, setRoom } = props;
  const [value, setValue] = useState("");
  const [roomValue, setRoomValue] = useState("");

  const handleNameChange = (e) => {
    setValue(e.target.value);
  };

  const handleRoomChange = (e) => {
    setRoomValue(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value && roomValue) {
      setName(value);
      setRoom(roomValue)
      setLoggedIn(true);
    }
  };

  const style = {
    margin: "auto",
    marginTop: "50px",
    width: "60%",
    padding: "10px",
  };

  return (
    <div style={style}>
      <h2>Välkommen till skärmdelningsappen</h2>
      <form onSubmit={handleSubmit}>
        <br></br>
        <input
          className="form-control mr-sm-2"
          type="name"
          placeholder="Namn"
          aria-label="Name"
          value={value}
          onChange={handleNameChange}
        />
        <br></br>
        <input
          className="form-control mr-sm-2"
          type="Room"
          placeholder="Skriv in ett rum att ansluta till"
          aria-label="Room"
          value={roomValue}
          onChange={handleRoomChange}
        />
        <br></br>
        <button type="submit" className="btn-primary">
          Enter
        </button>
      </form>
    </div>
  );
};

export default Login;
