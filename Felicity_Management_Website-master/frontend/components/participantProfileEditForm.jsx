import { useEffect, useState } from "react";
import API_ENDPOINTS from "../src/config/apiConfig";

const categories = [
    'Coding',
    'Design & Theory',
    'Cultural',
    'Sports & Games',
    'Student Body',
    'Councils & Committees',
    'Other'
];

const ParticipantProfileEditForm = ({ profile, participant, onCancel, onSuccess }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [collegeName, setCollegeName] = useState('');
    const [contactNo, setContactNo] = useState('');
    const [interests, setInterests] = useState([]);
    const [organizers, setOrganizers] = useState([]);
    const [followedOrganizers, setFollowedOrganizers] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (profile) {
            setFirstName(profile.firstName || '');
            setLastName(profile.lastName || '');
            setCollegeName(profile.collegeName || '');
            setContactNo(profile.contactNo || '');
            setInterests(profile.interests || []);
            if (profile.followedOrganizers) {
                const ids = profile.followedOrganizers.map((org) => org._id || org);
                setFollowedOrganizers(ids);
            }
        }
    }, [profile]);

    useEffect(() => {
        const fetchOrganizers = async () => {
            try {
                const response = await fetch(API_ENDPOINTS.PARTICIPANT.GET_ORGANIZERS, {
                    headers: { 'Authorization': `Bearer ${participant.token}` }
                });
                const data = await response.json();
                if (response.ok) {
                    setOrganizers(data);
                }
            } catch (err) {
                setError('Failed to load organizers');
            }
        };

        fetchOrganizers();
    }, [participant]);

    const toggleInterest = (value) => {
        setInterests((prev) => prev.includes(value)
            ? prev.filter((item) => item !== value)
            : [...prev, value]);
    };

    const toggleOrganizer = (id) => {
        setFollowedOrganizers((prev) => prev.includes(id)
            ? prev.filter((item) => item !== id)
            : [...prev, id]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!firstName) {
            setError('First name is required');
            return;
        }

        const payload = {
            firstName,
            lastName,
            collegeName,
            contactNo,
            interests,
            followedOrganizers
        };

        try {
            const response = await fetch(API_ENDPOINTS.PARTICIPANT.UPDATE_PROFILE, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${participant.token}`
                },
                body: JSON.stringify(payload)
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

            <label>First Name: <span style={{color: 'red'}}>*</span></label>
            <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
            />

            <label>Last Name:</label>
            <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
            />

            <label>College Name:</label>
            <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
            />

            <label>Contact Number:</label>
            <input
                type="text"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
            />

            <label>Interests:</label>
            <div className="profile-checklist">
                {categories.map((category) => (
                    <label key={category} className="profile-checkbox">
                        <input
                            type="checkbox"
                            checked={interests.includes(category)}
                            onChange={() => toggleInterest(category)}
                        />
                        <span>{category}</span>
                    </label>
                ))}
            </div>

            <label>Interested Organizers:</label>
            <div className="profile-checklist">
                {organizers.length === 0 && <p>No organizers available yet.</p>}
                {organizers.map((organizer) => (
                    <label key={organizer._id} className="profile-checkbox">
                        <input
                            type="checkbox"
                            checked={followedOrganizers.includes(organizer._id)}
                            onChange={() => toggleOrganizer(organizer._id)}
                        />
                        <span>{organizer.organizerName} ({organizer.category})</span>
                    </label>
                ))}
            </div>

            <div className="profile-actions">
                <button className="btn-primary" type="submit">Save Changes</button>
                <button className="btn-secondary" type="button" onClick={onCancel}>Cancel</button>
            </div>

            {error && <div className="error">{error}</div>}
        </form>
    );
};

export default ParticipantProfileEditForm;
