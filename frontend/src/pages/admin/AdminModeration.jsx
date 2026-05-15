import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Trash2, RefreshCw } from 'lucide-react';
import {
  getFlaggedContent,
  reviewFlaggedContent,
  broadcastNotification,
} from '../../services/adminApi';
import './AdminModeration.css';

const AdminModeration = () => {
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState(''); // approved, rejected, removed
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchFlaggedContent();
  }, []);

  const fetchFlaggedContent = async () => {
    try {
      setLoading(true);
      const res = await getFlaggedContent();
      setFlaggedContent(res.data.items || []);
    } catch (error) {
      console.error('Failed to fetch flagged content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    try {
      await reviewFlaggedContent(selectedItem.id, action, reason);
      await fetchFlaggedContent();
      setShowModal(false);
      setSelectedItem(null);
      setReason('');
    } catch (error) {
      console.error('Review failed:', error);
      alert('Review failed: ' + error.message);
    }
  };

  return (
    <div className="admin-moderation">
      <div className="moderation-header">
        <h1>Content Moderation</h1>
        <button className="refresh-btn" onClick={fetchFlaggedContent}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {flaggedContent.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={32} />
          <p>No flagged content to review</p>
        </div>
      ) : (
        <div className="flagged-list">
          {flaggedContent.map((item) => (
            <div key={item.id} className="flagged-item">
              <div className="item-header">
                <div className="item-info">
                  <AlertTriangle className="flag-icon" size={20} />
                  <div className="item-details">
                    <h3>{item.type}</h3>
                    <p className="item-reason">{item.reason}</p>
                    <p className="item-meta">
                      Flagged by: {item.flaggedBy} •{' '}
                      {new Date(item.flaggedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  className="review-btn"
                  onClick={() => {
                    setSelectedItem(item);
                    setShowModal(true);
                  }}
                >
                  Review
                </button>
              </div>
              <div className="item-content">
                <p>{item.description}</p>
                {item.contentUrl && (
                  <a href={item.contentUrl} target="_blank" rel="noopener noreferrer">
                    View Content
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {showModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Flagged Content</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="content-preview">
                <h4>Content Details:</h4>
                <p><strong>Type:</strong> {selectedItem.type}</p>
                <p><strong>Reason Flagged:</strong> {selectedItem.reason}</p>
                <p><strong>Description:</strong> {selectedItem.description}</p>
                {selectedItem.contentUrl && (
                  <a href={selectedItem.contentUrl} target="_blank" rel="noopener noreferrer">
                    View Content
                  </a>
                )}
              </div>

              <div className="action-selection">
                <label>
                  <input
                    type="radio"
                    value="approved"
                    checked={action === 'approved'}
                    onChange={(e) => setAction(e.target.value)}
                  />
                  Approve (Content is OK)
                </label>
                <label>
                  <input
                    type="radio"
                    value="rejected"
                    checked={action === 'rejected'}
                    onChange={(e) => setAction(e.target.value)}
                  />
                  Reject (Flag is invalid)
                </label>
                <label>
                  <input
                    type="radio"
                    value="removed"
                    checked={action === 'removed'}
                    onChange={(e) => setAction(e.target.value)}
                  />
                  Remove (Content violates rules)
                </label>
              </div>

              <textarea
                placeholder="Add notes about your decision..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="reason-textarea"
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn-primary"
                onClick={handleReview}
                disabled={!action || !reason}
              >
                Submit Review
              </button>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModeration;
