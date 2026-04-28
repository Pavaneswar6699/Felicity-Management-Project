import { useState, useEffect } from "react";
import API_ENDPOINTS from "../src/config/apiConfig";

const ProfileEditForm = ({ profile, organizer, onCancel, onSuccess }) => {
    const [organizerName, setOrganizerName] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [mobileNo, setMobileNo] = useState('');
    const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
    const [error, setError] = useState(null);

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    useEffect(() => {
        if (profile) {
            setOrganizerName(profile.organizerName || '');
            setCategory(profile.category || '');
            setDescription(profile.description || '');
            setContactEmail(profile.contactEmail || '');
            setMobileNo(profile.mobileNo || '');
            setDiscordWebhookUrl(profile.discordWebhookUrl || '');
        }
    }, [profile]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!organizerName || !category) {
            setError('Name and category are required');
            return;
        }

        if (!contactEmail.trim()) {
            setError('Contact email is required');
            return;
        }

        if (!isValidEmail(contactEmail.trim())) {
            setError('Please enter a valid contact email');
            return;
        }

        try {
            const response = await fetch(API_ENDPOINTS.ORGANIZER.UPDATE_PROFILE, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${organizer.token}`
                },
                body: JSON.stringify({
                    organizerName,
                    category,
                    description,
                    contactEmail: contactEmail.trim().toLowerCase(),
                    mobileNo,
                    discordWebhookUrl
                })
            });

            const data = await response.json();

            if (response.ok) {
                onSuccess(data, 'Profile updated successfully');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to update profile');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3>Edit Profile</h3>

            <label>Organizer Name: <span style={{ color: 'red' }}>*</span></label>
            <input
                type="text"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
            />

            <label>Category: <span style={{ color: 'red' }}>*</span></label>
            <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
            >
                <option value="">Select category...</option>
                <option value="Coding">Coding</option>
                <option value="Design & Theory">Design & Theory</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports & Games">Sports & Games</option>
                <option value="Student Body">Student Body</option>
                <option value="Councils & Committees">Councils & Committees</option>
                <option value="Other">Other</option>
            </select>

            <label>Description:</label>
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="4"
            />

            <label>Contact Email: <span style={{ color: 'red' }}>*</span></label>
            <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
            />

            <label>Mobile Number:</label>
            <input
                type="text"
                value={mobileNo}
                onChange={(e) => setMobileNo(e.target.value)}
            />

            <label>Discord Webhook URL:</label>
            <input
                type="text"
                placeholder="https://discord.com/api/webhooks/..."
                value={discordWebhookUrl}
                onChange={(e) => setDiscordWebhookUrl(e.target.value)}
            />

            <div className="profile-actions">
                <button className="btn-primary" type="submit">Save Changes</button>
                <button className="btn-secondary" type="button" onClick={onCancel}>Cancel</button>
            </div>

            {error && <div className="error">{error}</div>}
        </form>
    );
};

export default ProfileEditForm;
