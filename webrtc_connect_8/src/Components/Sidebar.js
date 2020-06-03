import React from "react";

const Sidebar = (props) => {
  const { peersInRoom} = props;

  return (
    <div className="bg-light border-right" id="sidebar-wrapper">
    <br></br>
      <div className="sidebar-heading">Anslutna i rummet:</div>
      <div>
      </div>
      <div id="sidebarContent">
        {peersInRoom.map( peer => (
          <div>
          <h4>{peer[1].name}</h4>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
