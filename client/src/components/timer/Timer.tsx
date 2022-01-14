import React, { useEffect, useState } from "react";
import "./Timer.css";

interface TimerProps {
  expiration: Date;
}

function getMillisecondsDiffFromNow(utcDate: Date): number {
  const now = new Date();
  now.setMinutes(utcDate.getTimezoneOffset() + now.getMinutes());
  return Math.max(0, utcDate.getTime() - now.getTime());
}

export default function Timer({ expiration }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(
    getMillisecondsDiffFromNow(expiration)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getMillisecondsDiffFromNow(expiration));
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, [expiration]);

  const getMillisDisplay = (millis: number) => {
    if (millis < 10000) {
      return (millis / 1000).toFixed(1).toString();
    }
    return Math.floor(millis / 1000).toString();
  };

  return (
    <>
      <div className="guess-timer">{getMillisDisplay(timeLeft)}</div>
    </>
  );
}
