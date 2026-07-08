import React from 'react';
import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: number; // Custom size in pixels
}

export function Spinner({ size = 40 }: SpinnerProps) {
  return (
    <div 
      className={styles.spinnerContainer} 
      style={{ '--spinner-size': `${size}px` } as React.CSSProperties}
    >
      <div className={styles.spinner}>
        {/* Create the 12 vertical radiating ticks */}
        {Array.from({ length: 12 }).map((_, index) => (
          <div 
            key={index} 
            className={styles.tick} 
            style={{ '--tick-index': index } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
