import React, { useState } from 'react';
import styles from '../styles/FeedbackButtons.module.css';

const FeedbackButtons = ({ messageId, onFeedback, currentFeedback }) => {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState('');

  const handleFeedback = (feedbackType) => {
    if (feedbackType === 'negative') {
      setShowCommentInput(true);
    } else {
      onFeedback(messageId, feedbackType, '');
      setShowCommentInput(false);
    }
  };

  const handleSubmitComment = () => {
    onFeedback(messageId, 'negative', comment);
    setShowCommentInput(false);
    setComment('');
  };

  const handleCancelComment = () => {
    setShowCommentInput(false);
    setComment('');
  };

  return (
    <div className={styles.feedbackContainer}>
      <div className={styles.feedbackButtons}>
        <button
          className={`${styles.feedbackBtn} ${styles.thumbsUp} ${
            currentFeedback?.type === 'positive' ? styles.active : ''
          }`}
          onClick={() => handleFeedback('positive')}
          disabled={currentFeedback?.type === 'positive'}
          title="This response was helpful"
        >
          👍
        </button>
        <button
          className={`${styles.feedbackBtn} ${styles.thumbsDown} ${
            currentFeedback?.type === 'negative' ? styles.active : ''
          }`}
          onClick={() => handleFeedback('negative')}
          disabled={currentFeedback?.type === 'negative'}
          title="This response needs improvement"
        >
          👎
        </button>
      </div>
      
      {showCommentInput && (
        <div className={styles.commentSection}>
          <textarea
            className={styles.commentInput}
            placeholder="Please tell us what went wrong or how we can improve..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="3"
          />
          <div className={styles.commentButtons}>
            <button
              className={styles.submitBtn}
              onClick={handleSubmitComment}
              disabled={!comment.trim()}
            >
              Submit Feedback
            </button>
            <button
              className={styles.cancelBtn}
              onClick={handleCancelComment}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {currentFeedback && (
        <div className={styles.feedbackStatus}>
          <span className={styles.feedbackText}>
            {currentFeedback.type === 'positive' 
              ? '✓ Thank you for your feedback!' 
              : '✓ Feedback submitted. Thank you for helping us improve!'
            }
          </span>
        </div>
      )}
    </div>
  );
};

export default FeedbackButtons;