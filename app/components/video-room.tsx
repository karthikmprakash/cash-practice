"use client";

import { useRef, useState } from "react";

type DailyFrame = { join: (opts: { url: string }) => Promise<unknown>; destroy: () => void };

export function VideoRoom({ roomUrl }: { roomUrl: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("The room is ready when you are.");

  async function connect() {
    setStatus("Connecting…");
    const frameHost = host.current;
    if (!frameHost) return;
    if (roomUrl.includes("daily.co")) {
      const Daily = (await import("@daily-co/daily-js")).default;
      const frame = Daily.createFrame(frameHost, {
        iframeStyle: { width: "100%", height: "480px", border: "0" },
      }) as DailyFrame;
      await frame.join({ url: roomUrl });
      setStatus("Connected.");
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("video vendor unavailable"));
      document.body.appendChild(script);
    });
    const url = new URL(roomUrl);
    const Jitsi = (window as unknown as {
      JitsiMeetExternalAPI: new (domain: string, options: unknown) => unknown;
    }).JitsiMeetExternalAPI;
    new Jitsi(url.host, {
      roomName: url.pathname.replace(/^\//, ""),
      parentNode: frameHost,
      configOverwrite: { subject: "Session" },
    });
    setStatus("Connected.");
  }

  return (
    <div className="stack">
      <p className="muted">{status}</p>
      <p><a href={roomUrl}>Join room</a></p>
      <button className="btn btn-primary" type="button" onClick={() => void connect()}>Connect video</button>
      <div ref={host} />
    </div>
  );
}
