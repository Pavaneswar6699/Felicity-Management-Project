import { useState } from "react";
import API_ENDPOINTS from "../src/config/apiConfig";

const ParticipantChangePasswordForm = ({ participant, onCancel, onSuccess }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!oldPassword || !newPassword || !confirmPassword) {
            setError('All password fields are required');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters long');
            return;
        }

        try {
            const response = await fetch(API_ENDPOINTS.PARTICIPANT.CHANGE_PASSWORD, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${participant.token}`
                },
                body: JSON.stringify({
                    email: participant.email,
                    oldPassword,
                    newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                onSuccess('Password changed successfully');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to change password');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3>Change Password</h3>

            <label>Old Password: <span style={{color: 'red'}}>*</span></label>
            <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
            />

            <label>New Password: <span style={{color: 'red'}}>*</span></label>
            <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
            />

            <label>Confirm New Password: <span style={{color: 'red'}}>*</span></label>
            <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <div className="profile-actions">
                <button className="btn-primary" type="submit">Change Password</button>
                <button className="btn-secondary" type="button" onClick={onCancel}>Cancel</button>
            </div>

            {error && <div className="error">{error}</div>}
        </form>
    );
};

export default ParticipantChangePasswordForm;
