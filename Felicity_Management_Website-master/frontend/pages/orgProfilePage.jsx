import { useEffect, useState } from "react";
import { useAuthContext } from "../hooks/useAuthContext";
import API_ENDPOINTS from "../src/config/apiConfig";
import ProfileView from "../components/profileView";
import ProfileEditForm from "../components/profileEditForm";
import ChangePasswordForm from "../components/changePasswordForm";

const OrgProfile = () => {
    const { organizer } = useAuthContext();
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(true);
    const [passwordRequests, setPasswordRequests] = useState([]);

    // Fetch organizer profile
    useEffect(() => {
        const fetchProfile = async () => {
            if (!organizer) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(API_ENDPOINTS.ORGANIZER.GET_PROFILE, {
                    headers: {
                        'Authorization': `Bearer ${organizer.token}`
                    }
                });
                const data = await response.json();

                if (response.ok) {
                    setProfile(data);
                } else {
                    setError(data.error);
                }
            } catch (err) {
                setError('Failed to fetch profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [organizer]);

    // Fetch password change requests
    useEffect(() => {
        const fetchPasswordRequests = async () => {
            if (!organizer) return;
            try {
                const response = await fetch(API_ENDPOINTS.ORGANIZER.GET_PASSWORD_CHANGE_REQUESTS, {
                    headers: {
                        'Authorization': `Bearer ${organizer.token}`
                    }
                });
                const data = await response.json();
                if (response.ok) {
                    setPasswordRequests(data);
                }
            } catch (err) {
                // silently fail — non-critical
            }
        };
        fetchPasswordRequests();
    }, [organizer]);

    const handleEditSuccess = (updatedProfile, message) => {
        setProfile(updatedProfile);
        setSuccess(message);
        setIsEditing(false);
        setError(null);
    };

    const handlePasswordChangeSuccess = (message) => {
        setSuccess(message);
        setIsChangingPassword(false);
        setError(null);
        // refresh requests list
        if (organizer) {
            fetch(API_ENDPOINTS.ORGANIZER.GET_PASSWORD_CHANGE_REQUESTS, {
                headers: { 'Authorization': `Bearer ${organizer.token}` }
            }).then(r => r.json()).then(data => {
                if (Array.isArray(data)) setPasswordRequests(data);
            }).catch(() => { });
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setError(null);
    };

    const handleCancelPasswordChange = () => {
        setIsChangingPassword(false);
        setError(null);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' ' + new Date(dateString).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
    };

    if (loading) {
        return <div className="pages">Loading...</div>;
    }

    if (!organizer) {
        return <div className="pages">Please log in to view your profile</div>;
    }

    return (
        <div className="pages">
            <h2>Organizer Profile</h2>

            {success && <div className="success-message">{success}</div>}
            {error && <div className="error">{error}</div>}

            <div className="event-details profile-container">
                {!isEditing ? (
                    <ProfileView
                        profile={profile}
                        onEdit={() => {
                            setIsEditing(true);
                            setIsChangingPassword(false);
                            setSuccess(null);
                        }}
                        onChangePassword={() => {
                            setIsChangingPassword(true);
                            setIsEditing(false);
                            setSuccess(null);
                        }}
                        disableEdit={isChangingPassword}
                        disableChangePassword={isEditing || passwordRequests.some(req => req.status === 'pending')}
                    />
                ) : (
                    <ProfileEditForm
                        profile={profile}
                        organizer={organizer}
                        onCancel={handleCancelEdit}
                        onSuccess={handleEditSuccess}
                    />
                )}
            </div>

            {isChangingPassword && (
                <div className="event-details profile-container">
                    <ChangePasswordForm
                        organizer={organizer}
                        onCancel={handleCancelPasswordChange}
                        onSuccess={handlePasswordChangeSuccess}
                    />
                </div>
            )}

            {/* Password Change Request History */}
            {passwordRequests.length > 0 && (
                <div className="event-details profile-container">
                    <h3>Password Change Requests</h3>
                    <div className="pw-request-list">
                        {passwordRequests.map((req) => (
                            <div key={req._id} className={`pw-request-card pw-request-card--${req.status}`}>
                                <p className="pw-request-status">
                                    Status: {req.status}
                                </p>
                                {req.reason && (
                                    <p className="pw-request-text">
                                        <strong>Reason:</strong> {req.reason}
                                    </p>
                                )}
                                <p className="pw-request-date">
                                    Submitted: {formatDate(req.createdAt)}
                                </p>
                                {req.status === 'rejected' && req.adminComments && (
                                    <p className="pw-request-comments">
                                        <strong>Admin Comments:</strong> {req.adminComments}
                                    </p>
                                )}
                                {req.status === 'approved' && req.approvedAt && (
                                    <p className="pw-request-timestamp">
                                        Approved: {formatDate(req.approvedAt)}
                                    </p>
                                )}
                                {req.status === 'rejected' && req.rejectedAt && (
                                    <p className="pw-request-timestamp">
                                        Rejected: {formatDate(req.rejectedAt)}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrgProfile;