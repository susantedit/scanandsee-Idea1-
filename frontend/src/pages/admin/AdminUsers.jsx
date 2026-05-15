import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Trash2,
  Ban,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  getUsers,
  getUserDetail,
  updateUserStatus,
  deleteUser,
} from '../../services/adminApi';
import './AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getUsers(page, 20, search);
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (userId) => {
    try {
      const res = await getUserDetail(userId);
      setSelectedUser(res.data);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }
  };

  const handleStatusChange = (action) => {
    setModalAction(action);
    setShowModal(true);
  };

  const confirmAction = async () => {
    try {
      if (modalAction === 'delete') {
        await deleteUser(selectedUser.id, reason);
      } else {
        await updateUserStatus(selectedUser.id, modalAction, reason);
      }
      setShowModal(false);
      setSelectedUser(null);
      setReason('');
      fetchUsers();
    } catch (error) {
      console.error('Action failed:', error);
      alert('Action failed: ' + error.message);
    }
  };

  return (
    <div className="admin-users">
      <div className="users-header">
        <h1>User Management</h1>
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search users by email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="users-container">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={32} />
            <p>No users found</p>
          </div>
        ) : (
          <>
            <table className="users-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Premium</th>
                  <th>Scans</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="email-cell">
                      <span className="avatar">
                        {user.email?.charAt(0).toUpperCase()}
                      </span>
                      {user.email}
                    </td>
                    <td>
                      {user.isPremium ? (
                        <span className="badge badge-premium">Premium</span>
                      ) : (
                        <span className="badge badge-free">Free</span>
                      )}
                    </td>
                    <td>{user.stats?.totalScans || 0}</td>
                    <td>
                      <span
                        className={`status-badge status-${
                          user.accountStatus || 'active'
                        }`}
                      >
                        {user.accountStatus || 'active'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="action-btn view-btn"
                        onClick={() => handleViewUser(user.id)}
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="action-btn ban-btn"
                        onClick={() => {
                          handleViewUser(user.id);
                          setTimeout(() => handleStatusChange('suspended'), 100);
                        }}
                        title="Suspend user"
                      >
                        <Ban size={16} />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => {
                          handleViewUser(user.id);
                          setTimeout(() => handleStatusChange('delete'), 100);
                        }}
                        title="Delete user"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span>
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <button
                disabled={page * 20 >= total}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && !showModal && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Details</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedUser(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <DetailRow label="ID" value={selectedUser.id} />
              <DetailRow label="Email" value={selectedUser.email} />
              <DetailRow
                label="Premium"
                value={selectedUser.isPremium ? 'Yes' : 'No'}
              />
              <DetailRow
                label="Total Scans"
                value={selectedUser.stats?.totalScans || 0}
              />
              <DetailRow
                label="Joined"
                value={new Date(selectedUser.stats?.joinedDate).toLocaleDateString()}
              />
              <DetailRow
                label="Last Active"
                value={new Date(
                  selectedUser.stats?.lastActive
                ).toLocaleDateString()}
              />
              <DetailRow label="Status" value={selectedUser.accountStatus || 'active'} />
            </div>
            <div className="modal-footer">
              <button
                className="action-btn suspend-btn"
                onClick={() => handleStatusChange('suspended')}
              >
                Suspend
              </button>
              <button
                className="action-btn delete-btn"
                onClick={() => handleStatusChange('delete')}
              >
                Delete
              </button>
              <button
                className="btn-secondary"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal confirmation-modal">
            <div className="modal-header">
              <h2>
                {modalAction === 'delete' ? 'Delete User' : 'Suspend User'}
              </h2>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to{' '}
                {modalAction === 'delete' ? 'delete' : 'suspend'} this user?
              </p>
              <textarea
                placeholder="Reason for action..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="reason-textarea"
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn-danger"
                onClick={confirmAction}
                disabled={!reason}
              >
                {modalAction === 'delete' ? 'Delete User' : 'Suspend User'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="detail-row">
    <span className="detail-label">{label}</span>
    <span className="detail-value">{value}</span>
  </div>
);

export default AdminUsers;
