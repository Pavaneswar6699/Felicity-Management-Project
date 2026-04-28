import { useState, useEffect } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import API_ENDPOINTS from '../src/config/apiConfig';

const AdminPasswordRequests = () => {
    const { admin } = useAuthContext();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionInProgress, setActionInProgress] = useState(false);
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [rejectionComments, setRejectionComments] = useState('');
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [generatedPasswords, setGeneratedPasswords] = useState({});

    useEffect(() => {
        fetchRequests();
    }, [admin]);

    const fetchRequests = async () => {
        if (!admin) return;
        try {
            setLoading(true);
            const response = await fetch(API_ENDPOINTS.ADMIN.GET_PASSWORD_CHANGE_REQUESTS, {
                headers: {
                    'Authorization': `Bearer ${admin.token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                setRequests(data);
            } else {
                setError(data.error || 'Failed to fetch requests');
            }
        } catch (err) {
            setError('Failed to load password reset requests');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId) => {
        if (!admin) return;
        try {
            setActionInProgress(true);
            const response = await fetch(API_ENDPOINTS.ADMIN.APPROVE_PASSWORD_CHANGE(requestId), {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${admin.token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                // Store the generated password for display
                setGeneratedPasswords({
                    ...generatedPasswords,
                    [requestId]: data.generatedPassword
                });
                alert(`✓ Password Reset Approved!\n\nOrganizer: ${data.organizerName}\nEmail: ${data.email}\nNew Password: ${data.generatedPassword}\n\nPlease share this password with the organizer.`);
                setRequests(requests.filter(req => req._id !== requestId));
            } else {
                alert('Error: ' + (data.error || 'Failed to approve request'));
            }
        } catch (err) {
            alert('Error: Failed to approve password reset request');
        } finally {
            setActionInProgress(false);
        }
    };

    const openRejectionModal = (requestId) => {
        setSelectedRequestId(requestId);
        setRejectionComments('');
        setShowRejectionModal(true);
    };

    const submitRejection = async () => {
        if (!admin) return;
        try {
            setActionInProgress(true);
            const response = await fetch(API_ENDPOINTS.ADMIN.REJECT_PASSWORD_CHANGE(selectedRequestId), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${admin.token}`
                },
                body: JSON.stringify({ comments: rejectionComments })
            });

            const data = await response.json();
            if (response.ok) {
                setRequests(requests.filter(req => req._id !== selectedRequestId));
                alert(`Password reset request rejected with comments: ${rejectionComments || 'No comments provided'}`);
                setShowRejectionModal(false);
                setRejectionComments('');
            } else {
                alert('Error: ' + (data.error || 'Failed to reject request'));
            }
        } catch (err) {
            alert('Error: Failed to reject password reset request');
        } finally {
            setActionInProgress(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' ' + new Date(dateString).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
    };

    if (loading) {
        return <div className="admin-container"><p>Loading password reset requests...</p></div>;
    }

    return (
        <div className="admin-container">
            <h2>Password Reset Requests</h2>

            {error && <div className="error">{error}</div>}

            {requests.length === 0 ? (
                <p style={{padding: '20px', textAlign: 'center', color: '#666'}}>No pending password reset requests.</p>
            ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    {requests.map((request) => (
                        <div key={request._id} style={{
                            background: '#fff',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            padding: '15px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{marginBottom: '10px'}}>
                                <p style={{margin: '0 0 4px 0', fontWeight: '600', fontSize: '1.05em'}}>{request.organizerId?.organizerName}</p>
                                <p style={{margin: '0 0 4px 0', color: '#666', fontSize: '0.9em'}}>{request.organizerId?.email}</p>
                                <p style={{margin: '0 0 4px 0', color: '#999', fontSize: '0.85em'}}>Requested: {formatDate(request.createdAt)}</p>
                                {request.reason && (
                                    <p style={{margin: '4px 0', color: '#555', fontSize: '0.9em'}}>
                                        <strong>Reason:</strong> {request.reason}
                                    </p>
                                )}
                            </div>

                            <div style={{display: 'flex', gap: '10px'}}>
                                <button
                                    style={{
                                        background: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                    onClick={() => handleApprove(request._id)}
                                    disabled={actionInProgress}
                                >
                                    Approve & Generate Password
                                </button>
                                <button
                                    style={{
                                        background: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                    onClick={() => openRejectionModal(request._id)}
                                    disabled={actionInProgress}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Rejection Modal */}
            {showRejectionModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '8px',
                        padding: '20px',
                        maxWidth: '400px',
                        width: '90%',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}>
                        <h3 style={{marginTop: 0, marginBottom: '15px'}}>Reject Password Reset Request</h3>
                        <textarea
                            placeholder="Enter rejection comments (optional)..."
                            value={rejectionComments}
                            onChange={(e) => setRejectionComments(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                fontFamily: 'Arial, sans-serif',
                                fontSize: '0.9em',
                                minHeight: '80px',
                                boxSizing: 'border-box'
                            }}
                        />
                        <div style={{
                            display: 'flex',
                            gap: '10px',
                            marginTop: '15px',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                onClick={() => setShowRejectionModal(false)}
                                style={{
                                    background: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                                disabled={actionInProgress}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitRejection}
                                style={{
                                    background: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                                disabled={actionInProgress}
                            >
                                Submit Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPasswordRequests;
