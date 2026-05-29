import React from 'react';

const ProgressBar = ({ value }) => {
  // Value expected: 0 to 100 (percentage remaining)
  const clampedValue = Math.max(0, Math.min(100, value));

  // Determine progress bar color based on remaining freshness percentage
  let barColor = 'var(--color-success)';
  if (clampedValue < 15) {
    barColor = 'var(--color-danger)';
  } else if (clampedValue < 50) {
    barColor = 'var(--color-warning)';
  }

  return (
    <div style={styles.track}>
      <div
        style={{
          ...styles.fill,
          width: `${clampedValue}%`,
          backgroundColor: barColor,
        }}
      />
    </div>
  );
};

const styles = {
  track: {
    width: '100%',
    height: '6px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '8px',
    marginBottom: '4px',
  },
  fill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.5s ease-out, background-color 0.3s ease',
  },
};

export default ProgressBar;
