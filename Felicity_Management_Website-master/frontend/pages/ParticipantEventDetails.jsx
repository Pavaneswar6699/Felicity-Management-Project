import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import API_ENDPOINTS from '../src/config/apiConfig';
import EventDetails from '../components/eventdetails';
import DiscussionForum from '../components/DiscussionForum';

const ParticipantEventDetails = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { participant } = useAuthContext();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvent = async () => {
            if (!participant || !eventId) {
                setError('Not authorized or missing event ID');
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Fetch all events and find the matching one
                const response = await fetch(`${API_ENDPOINTS.PARTICIPANT.GET_EVENTS}?limit=1000&includeCompleted=true`, {
                    headers: {
                        'Authorization': `Bearer ${participant.token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch events');
                }

                const data = await response.json();

                // Handle both paginated and non-paginated responses
                let events = [];
                if (Array.isArray(data)) {
                    events = data;
                } else if (data.events) {
                    events = data.events;
                }

                // Find the specific event
                const foundEvent = events.find(e => e._id === eventId);

                if (!foundEvent) {
                    setError('Event not found');
                    setEvent(null);
                } else {
                    setEvent(foundEvent);
                    setError(null);
                }
            } catch (err) {
                setError(err.message || 'Failed to load event');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [participant, eventId]);

    if (loading) {
        return (
            <div className="event-details-page">
                <p>Loading event details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="event-details-page">
                <div className="error">{error}</div>
                <button onClick={() => navigate('/participantHome')} className="publish-register-button">
                    Back to Events
                </button>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="event-details-page">
                <p>Event not found</p>
                <button onClick={() => navigate('/participantHome')} className="publish-register-button">
                    Back to Events
                </button>
            </div>
        );
    }

    return (
        <div className="event-details-page">
            <button
                onClick={() => navigate('/participantHome')}
                className="back-button"
                style={{ marginBottom: '20px' }}
            >
                ← Back to Events
            </button>
            <EventDetails event={event} />
            <DiscussionForum eventId={event._id} role="participant" token={participant.token} />
        </div>
    );
};

export default ParticipantEventDetails;
