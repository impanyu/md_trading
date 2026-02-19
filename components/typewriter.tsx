"use client";

import { useState, useEffect } from "react";

type Props = {
  text: string;
  speed?: number;
};

export function Typewriter({ text, speed = 35 }: Props) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span className="typewriter">
      <span className="typewriter-inner" style={done ? { borderColor: "transparent" } : undefined}>
        {displayed}
      </span>
      {done && <span className="cursor" />}
    </span>
  );
}
