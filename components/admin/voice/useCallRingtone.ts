"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const RINGTONE_PATH = "/sounds/incoming-call.mp3";

let audioUnlocked = false;

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.01);
    void ctx.close();
  } catch {
    // ignore
  }
}

export function useCallRingtone() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [needsTap, setNeedsTap] = useState(false);

  useEffect(() => {
    const onGesture = () => {
      unlockAudio();
      setNeedsTap(false);
    };
    window.addEventListener("click", onGesture, { once: true });
    window.addEventListener("keydown", onGesture, { once: true });
    return () => {
      window.removeEventListener("click", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  const play = useCallback(async () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(RINGTONE_PATH);
      audioRef.current.loop = true;
    }
    const audio = audioRef.current;
    try {
      await audio.play();
      setNeedsTap(false);
    } catch {
      setNeedsTap(true);
    }
  }, []);

  const unlockAndPlay = useCallback(async () => {
    unlockAudio();
    await play();
  }, [play]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { play, stop, unlockAndPlay, needsTap };
}

export function useRingbackTone() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  const play = useCallback(async () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(RINGTONE_PATH);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.35;
    }
    try {
      await audioRef.current.play();
    } catch {
      // ringback is optional
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { play, stop };
}
