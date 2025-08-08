"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** 0–100 */
  progress: number;
  /** px */
  size?: number;
  /** px */
  stroke?: number;
  /** mark as complete */
  done?: boolean;
  /** small label under % */
  label?: string;
};

export default function ProcessingProgressRing({
  progress,
  size = 112,
  stroke = 6,
  done = false,
  label = "Processing",
}: Props) {
  // clamp 0..100
  const p = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));

  // geometry
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - p / 100);

  // simple elapsed timer (so you get a live counter)
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    // start counting when progress starts
    if (p > 0 && !done && timerRef.current == null) {
      startRef.current = performance.now();
      timerRef.current = window.setInterval(() => {
        if (startRef.current != null) {
          setElapsedMs(performance.now() - startRef.current);
        }
      }, 60);
    }
    // stop when done or reset when progress is zeroed
    if (done || p === 0) {
      if (timerRef.current != null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (p === 0) {
        startRef.current = null;
        setElapsedMs(0);
      }
    }
    return () => {
      if (timerRef.current != null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [p, done]);

  const ms = Math.max(0, Math.round(elapsedMs));
  const seconds = Math.floor(ms / 1000);
  const millis = String(ms % 1000).padStart(3, "0");

  // Always render when there is progress or we're done (lets you see the finish)
  if (p === 0 && !done) return null;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={p}
      aria-label={label}
      className="relative"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#374151"
          strokeWidth={stroke}
        />

        {/* progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={done ? "#22c55e" : "#60a5fa"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          // start from 12 o'clock
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          // smooth updates
          style={{ transition: "stroke-dashoffset 180ms linear, stroke 180ms linear" }}
        />

        {/* % text */}
        <text
          x="50%"
          y="46%"
          dominantBaseline="middle"
          textAnchor="middle"
          style={{
            fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
            fontWeight: 700,
            fontSize: size * 0.22,
            fill: done ? "#22c55e" : "#e5e7eb",
          }}
        >
          {done ? "100%" : `${p.toFixed(0)}%`}
        </text>

        {/* label */}
        <text
          x="50%"
          y="63%"
          dominantBaseline="middle"
          textAnchor="middle"
          style={{
            fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
            fontSize: size * 0.10,
            fill: "#9ca3af",
            letterSpacing: "0.06em",
          }}
        >
          {done ? "Done" : label}
        </text>

        {/* elapsed time */}
        {!done && (
          <text
            x="50%"
            y="77%"
            dominantBaseline="middle"
            textAnchor="middle"
            style={{
              fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
              fontSize: size * 0.09,
              fill: "#9ca3af",
            }}
          >
            {seconds}.{millis}s
          </text>
        )}
      </svg>
    </div>
  );
}
