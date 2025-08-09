"use client";

import { useState, useEffect, useMemo, useRef } from "react";

interface ProcessingProgressRingProps {
  progress: number;
  done: boolean;
  label?: string;
}

export default function ProcessingProgressRing({ 
  progress, 
  done, 
  label = "Processing" 
}: ProcessingProgressRingProps) {
  const [displayed, setDisplayed] = useState(0);
  const [visible, setVisible] = useState(false);
  const elapsedMs = useRef(0);
  const startTime = useRef<number | null>(null);

  // Calculate dimensions
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = useMemo(() => {
    const percentage = Math.min(100, Math.max(0, displayed));
    return circumference - (percentage / 100) * circumference;
  }, [displayed, circumference]);

  const fontSize = useMemo(() => {
    return Math.max(12, Math.min(16, 14 + (displayed / 100) * 4));
  }, [displayed]);

  // Animate displayed progress towards actual progress
  useEffect(() => {
    if (progress === 0) {
      setDisplayed(0);
      setVisible(false);
      return;
    }

    if (!visible) {
      setVisible(true);
      startTime.current = Date.now();
    }

    const target = done ? 100 : progress;
    const diff = target - displayed;
    
    if (Math.abs(diff) < 0.1) {
      setDisplayed(target);
      return;
    }

    const increment = diff * 0.1;
    setDisplayed(prev => prev + increment);
  }, [progress, done, visible, displayed]);

  // Reset when done
  useEffect(() => {
    if (done && displayed >= 99.9) {
      const timer = setTimeout(() => {
        setVisible(false);
        setDisplayed(0);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [done, displayed]);

  if (!visible) return null;

  return (
    <div className="relative w-24 h-24">
      <svg
        className="w-24 h-24 transform -rotate-90"
        viewBox="0 0 100 100"
      >
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="rgba(75, 85, 99, 0.3)"
          strokeWidth="4"
          fill="none"
        />
        
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="url(#gradient)"
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        
        {/* Animated dots when processing */}
        {!done && (
          <>
            <circle
              cx="50"
              cy="50"
              r="2"
              fill="#10b981"
              className="animate-pulse"
            />
            <circle
              cx="50"
              cy="50"
              r="1"
              fill="#3b82f6"
              className="animate-ping"
              style={{ animationDelay: '0.5s' }}
            />
          </>
        )}
        
        {/* Success checkmark when done */}
        {done && (
          <path
            d="M35 50 L45 60 L65 40"
            stroke="#10b981"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-draw"
          />
        )}
      </svg>
      
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span 
          className="font-bold text-gray-200 transition-all duration-300"
          style={{ fontSize: `${fontSize}px` }}
        >
          {done ? "✓" : `${Math.round(displayed)}%`}
        </span>
      </div>
      
      {/* Label */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
        <span className="text-xs text-gray-400 font-medium">
          {done ? "Complete" : label}
        </span>
      </div>
    </div>
  );
}
