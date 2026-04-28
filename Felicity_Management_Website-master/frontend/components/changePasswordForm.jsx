import { useState } from "react";
import API_ENDPOINTS from "../src/config/apiConfig";

const ChangePasswordForm = ({ organizer, onCancel, onSuccess }) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        
        try {
            const response = await fetch(API_ENDPOINTS.ORGANIZER.REQUEST_PASSWORD_CHANGE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${organizer.token}`
                },
                body: JSON.stringify({
                    reason: reason || 'Password reset requested'
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setReason('');
                onSuccess('Password reset request submitted! Admin approval is required.');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to submit password reset request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3>Request Password Reset</h3>
            <p style={{fontSize: '0.9em', color: '#666', marginBottom: '1rem'}}>
                Your password reset request will be submitted to the admin for approval. 
                Once approved, the admin will generate a new password and share it with you.
            </p>
            
            <label>Reason for Password Reset: <span style={{color: 'red'}}>*</span></label>
            <textarea 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={loading}
                placeholder="Enter reason for password reset (e.g., 'Forgot password', 'Account security', etc.)"
                style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '0.95em',
                    minHeight: '80px',
                    boxSizing: 'border-box'
                }}
            />
            
            <div className="profile-actions">
                <button className="btn-primary" type="submit" disabled={loading}>
                    {loading ? 'Submitting...' : 'Request Password Reset'}
                </button>
                <button className="btn-secondary" type="button" onClick={onCancel} disabled={loading}>
                    Cancel
                </button>
            </div>
            
            {error && <div className="error">{error}</div>}
        </form>
    );
};

export default ChangePasswordForm;
