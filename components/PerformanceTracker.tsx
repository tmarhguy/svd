"use client";

import { useEffect } from 'react';

export default function PerformanceTracker() {
  useEffect(() => {
    // Only run in production and when web vitals are available
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Track First Contentful Paint
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            console.log('FCP:', entry.startTime);
            // You can send this to analytics here
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['paint'] });
      } catch (e) {
        // Fallback for older browsers
        console.log('PerformanceObserver not supported');
      }

      // Track Largest Contentful Paint
      let lcpObserver: PerformanceObserver | undefined;
      if ('PerformanceObserver' in window) {
        lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('LCP:', lastEntry.startTime);
        });
        
        try {
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          console.log('LCP tracking not supported');
        }
      }

      // Track Cumulative Layout Shift
      let clsObserver: PerformanceObserver | undefined;
      if ('PerformanceObserver' in window) {
        clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
            if (!layoutShiftEntry.hadRecentInput) {
              clsValue += layoutShiftEntry.value || 0;
            }
          }
          console.log('CLS:', clsValue);
        });
        
        try {
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          console.log('CLS tracking not supported');
        }
      }

      return () => {
        observer.disconnect();
        if ('PerformanceObserver' in window) {
          try {
            lcpObserver?.disconnect();
            clsObserver?.disconnect();
          } catch (e) {
            // Ignore errors on cleanup
          }
        }
      };
    }
  }, []);

  return null; // This component doesn't render anything
}
