const ParticipantProfileView = ({ profile, onEdit, onChangePassword, disableEdit, disableChangePassword }) => {
    return (
        <>
            <h4>{profile?.firstName} {profile?.lastName}</h4>
            <p><strong>Email:</strong> {profile?.email}</p>
            <p><strong>Participant Type:</strong> {profile?.participantType}</p>
            {profile?.collegeName && <p><strong>College:</strong> {profile?.collegeName}</p>}
            {profile?.contactNo && <p><strong>Contact:</strong> {profile?.contactNo}</p>}
            {profile?.interests && profile.interests.length > 0 && (
                <p><strong>Interests:</strong> {profile.interests.join(', ')}</p>
            )}
            {profile?.followedOrganizers && profile.followedOrganizers.length > 0 && (
                <p><strong>Following:</strong> {profile.followedOrganizers.map((org) => org.organizerName).join(', ')}</p>
            )}

            <div className="profile-actions">
                <button className="btn-primary" onClick={onEdit} disabled={disableEdit}>Edit Profile</button>
                <button className="btn-secondary" onClick={onChangePassword} disabled={disableChangePassword}>Change Password</button>
            </div>
        </>
    );
};

export default ParticipantProfileView;
