const ProfileView = ({ profile, onEdit, onChangePassword, disableEdit, disableChangePassword }) => {
    return (
        <>
            <h4>{profile?.organizerName}</h4>
            <p><strong>Email:</strong> {profile?.email}</p>
            <p><strong>Category:</strong> {profile?.category}</p>
            {profile?.description && <p><strong>Description:</strong> {profile?.description}</p>}
            <p><strong>Contact Email:</strong> {profile?.contactEmail || 'N/A'}</p>
            <p><strong>Mobile Number:</strong> {profile?.mobileNo || 'N/A'}</p>
            {profile?.discordWebhookUrl && <p className="webhook-url-container"><strong>Discord Webhook:</strong> <span className="webhook-url">{profile?.discordWebhookUrl}</span></p>}

            <div className="profile-actions">
                <button className="btn-primary" onClick={onEdit} disabled={disableEdit}>Edit Profile</button>
                <button className="btn-secondary" onClick={onChangePassword} disabled={disableChangePassword}>Change Password</button>
            </div>
        </>
    );
};

export default ProfileView;
