import React, { useState } from 'react';
import styles from '../styles/HumanHelpModal.module.css';

const HumanHelpModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    reason: '',
    contactNumber: '',
    priority: 'medium'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.reason.trim()) {
      newErrors.reason = 'Please describe why you need assistance';
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = 'Please provide more details (at least 10 characters)';
    }

    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.contactNumber.trim())) {
      newErrors.contactNumber = 'Please enter a valid contact number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call delay (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Failed to submit human help request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      reason: '',
      contactNumber: '',
      priority: 'medium'
    });
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Request Human Assistance</h2>
          <button 
            className={styles.closeButton}
            onClick={handleClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="reason">Reason for Assistance *</label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              className={errors.reason ? styles.inputError : ''}
              placeholder="Please describe your issue or why you need human assistance..."
              rows="4"
            />
            {errors.reason && <span className={styles.errorText}>{errors.reason}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="contactNumber">Contact Number *</label>
            <input
              type="tel"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleInputChange}
              className={errors.contactNumber ? styles.inputError : ''}
              placeholder="Enter your phone number"
            />
            {errors.contactNumber && <span className={styles.errorText}>{errors.contactNumber}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="priority">Priority Level</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
            >
              <option value="low">Low - General inquiry</option>
              <option value="medium">Medium - Need assistance soon</option>
              <option value="high">High - Urgent matter</option>
              <option value="critical">Critical - Immediate attention needed</option>
            </select>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Request Human Help'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HumanHelpModal;
