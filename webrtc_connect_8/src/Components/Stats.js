import React, { useEffect, useRef, useState } from "react";

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

let prev, sender;

const Stats = (props) => {
  const [bitrateOut, setBitrateOut] = useState(0);
  const [bitrateIn, setBitrateIn] = useState(0);
  const { pcs, id } = props;
  let pc = pcs[id];

  useEffect(() => {
    sender = pc.getSenders()[0];
  }, []);

  useInterval(() => {
    if (!pc || !sender) {
      console.log("return", pc, sender);
      return;
    }
    sender.getStats().then((statsReport) => {
      statsReport.forEach((stat) => {
        if (stat.type === "transport") {
          if (prev && prev.has(stat.id)) {
            const timeDifference =
              (stat.timestamp - prev.get(stat.id).timestamp) / 1000;
            const btrOut =
              (8 * (stat.bytesSent - prev.get(stat.id).bytesSent)) /
              timeDifference /
              100000;
            const btrIn =
              (8 * (stat.bytesReceived - prev.get(stat.id).bytesReceived)) /
              timeDifference / 100000;

            setBitrateOut(btrOut.toFixed(2));
            setBitrateIn(btrIn.toFixed(2));
          }
        }
      });
      prev = statsReport;
    });
  }, 1000);

  return (
    <div>
        <div>
          <p>Bitrate utgående: {bitrateOut} Mbit/s | Bitrate inkommande: {bitrateIn} Mbit/s </p>
        </div>
    </div>
  );
};

export default Stats;
