import React from 'react';
import styles from '../styles/TypingIndicator.module.css';

const TypingIndicator = () => {
  return (
    <div className={styles.typingIndicatorContainer}>
      <div className={styles.avatarSmall}>
        <span role="img" aria-label="bot">🤖</span>
      </div>
      <div className={styles.typingBubble}>
        <div className={styles.typingAnimation}>
          <span className={styles.dot}></span>
          <span className={styles.dot}></span>
          <span className={styles.dot}></span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;