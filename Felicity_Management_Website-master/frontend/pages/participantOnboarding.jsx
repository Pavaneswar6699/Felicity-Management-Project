import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";
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

const ParticipantOnboarding = () => {
    const { participant } = useAuthContext();
    const navigate = useNavigate();
    const [organizers, setOrganizers] = useState([]);
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [selectedOrganizers, setSelectedOrganizers] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrganizers = async () => {
            if (!participant) {
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(API_ENDPOINTS.PARTICIPANT.GET_ORGANIZERS, {
                    headers: { 'Authorization': `Bearer ${participant.token}` }
                });
                const data = await response.json();
                if (response.ok) {
                    setOrganizers(data);
                } else {
                    setError(data.error || 'Failed to load organizers');
                }
            } catch (err) {
                setError('Failed to load organizers');
            } finally {
                setLoading(false);
            }
        };

        fetchOrganizers();
    }, [participant]);

    const toggleInterest = (value) => {
        setSelectedInterests((prev) => prev.includes(value)
            ? prev.filter((item) => item !== value)
            : [...prev, value]);
    };

    const toggleOrganizer = (id) => {
        setSelectedOrganizers((prev) => prev.includes(id)
            ? prev.filter((item) => item !== id)
            : [...prev, id]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const response = await fetch(API_ENDPOINTS.PARTICIPANT.UPDATE_PROFILE, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${participant.token}`
                },
                body: JSON.stringify({
                    interests: selectedInterests,
                    followedOrganizers: selectedOrganizers
                })
            });

            const data = await response.json();
            if (!response.ok) {
                setError(data.error || 'Failed to save preferences');
                return;
            }
            localStorage.removeItem('participantOnboardingPending');
            navigate('/participantHome');
        } catch (err) {
            setError('Failed to save preferences');
        }
    };

    if (!participant) {
        return <div className="pages">Please log in to continue</div>;
    }

    if (loading) {
        return <div className="pages">Loading...</div>;
    }

    return (
        <div className="pages">
            <h2>Pick Your Interests</h2>
            <p>Select event categories and organizers you want to follow. You can skip and update later in your profile.</p>

            <form className="event-details" style={{maxWidth: '700px', margin: '20px auto'}} onSubmit={handleSubmit}>
                <h3>Interests</h3>
                <div className="profile-checklist">
                    {categories.map((category) => (
                        <label key={category} className="profile-checkbox">
                            <input
                                type="checkbox"
                                checked={selectedInterests.includes(category)}
                                onChange={() => toggleInterest(category)}
                            />
                            <span>{category}</span>
                        </label>
                    ))}
                </div>

                <h3>Organizers</h3>
                <div className="profile-checklist">
                    {organizers.length === 0 && <p>No organizers available yet.</p>}
                    {organizers.map((organizer) => (
                        <label key={organizer._id} className="profile-checkbox">
                            <input
                                type="checkbox"
                                checked={selectedOrganizers.includes(organizer._id)}
                                onChange={() => toggleOrganizer(organizer._id)}
                            />
                            <span>{organizer.organizerName} ({organizer.category})</span>
                        </label>
                    ))}
                </div>

                <div className="profile-actions">
                    <button className="btn-primary" type="submit">Save and Continue</button>
                    <button className="btn-secondary" type="button" onClick={() => {
                        localStorage.removeItem('participantOnboardingPending');
                        navigate('/participantHome');
                    }}>Skip for Now</button>
                </div>

                {error && <div className="error">{error}</div>}
            </form>
        </div>
    );
};

export default ParticipantOnboarding;
