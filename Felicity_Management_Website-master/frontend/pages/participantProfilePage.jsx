import { useEffect, useState } from "react";
import { useAuthContext } from "../hooks/useAuthContext";
import API_ENDPOINTS from "../src/config/apiConfig";
import ParticipantProfileView from "../components/participantProfileView";
import ParticipantProfileEditForm from "../components/participantProfileEditForm";
import ParticipantChangePasswordForm from "../components/participantChangePasswordForm";

const ParticipantProfile = () => {
    const { participant } = useAuthContext();
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!participant) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(API_ENDPOINTS.PARTICIPANT.GET_PROFILE, {
                    headers: {
                        'Authorization': `Bearer ${participant.token}`
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
    }, [participant]);

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
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setError(null);
    };

    const handleCancelPasswordChange = () => {
        setIsChangingPassword(false);
        setError(null);
    };

    if (loading) {
        return <div className="pages">Loading...</div>;
    }

    if (!participant) {
        return <div className="pages">Please log in to view your profile</div>;
    }

    return (
        <div className="pages">
            <h2>Participant Profile</h2>

            {success && <div style={{padding: '10px', background: '#d4edda', border: '1px solid #28a745', color: '#155724', borderRadius: '4px', margin: '20px 0'}}>{success}</div>}
            {error && <div className="error">{error}</div>}

            <div className="event-details" style={{maxWidth: '600px', margin: '20px auto'}}>
                {!isEditing ? (
                    <ParticipantProfileView
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
                        disableChangePassword={isEditing}
                    />
                ) : (
                    <ParticipantProfileEditForm
                        profile={profile}
                        participant={participant}
                        onCancel={handleCancelEdit}
                        onSuccess={handleEditSuccess}
                    />
                )}
            </div>

            {isChangingPassword && (
                <div className="event-details" style={{maxWidth: '600px', margin: '20px auto'}}>
                    <ParticipantChangePasswordForm
                        participant={participant}
                        onCancel={handleCancelPasswordChange}
                        onSuccess={handlePasswordChangeSuccess}
                    />
                </div>
            )}
        </div>
    );
};

export default ParticipantProfile;
