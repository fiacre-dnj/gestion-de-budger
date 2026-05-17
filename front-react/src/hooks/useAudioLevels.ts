import { useCallback, useRef, useState } from 'react';

const BAR_COUNT = 16;
const IDLE_LEVEL = 0.15;

export function useAudioLevels() {
  const [levels, setLevels] = useState<number[]>(() =>
    Array.from({ length: BAR_COUNT }, () => IDLE_LEVEL),
  );
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    analyserRef.current = null;
    if (audioContextRef.current?.state !== 'closed') {
      void audioContextRef.current?.close();
    }
    audioContextRef.current = null;
    setLevels(Array.from({ length: BAR_COUNT }, () => IDLE_LEVEL));
  }, []);

  const start = useCallback(async () => {
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        const step = Math.floor(bufferLength / BAR_COUNT);
        const nextLevels = Array.from({ length: BAR_COUNT }, (_, i) => {
          let sum = 0;
          const startIdx = i * step;
          for (let j = 0; j < step; j++) {
            sum += dataArray[startIdx + j] ?? 0;
          }
          const avg = sum / step / 255;
          return Math.max(IDLE_LEVEL, Math.min(1, avg * 2.2));
        });

        setLevels(nextLevels);
        rafRef.current = requestAnimationFrame(tick);
      };

      tick();
    } catch {
      setLevels(Array.from({ length: BAR_COUNT }, () => IDLE_LEVEL));
    }
  }, [stop]);

  return { levels, start, stop, barCount: BAR_COUNT };
}
