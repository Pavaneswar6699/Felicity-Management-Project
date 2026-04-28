import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";
import API_ENDPOINTS from "../src/config/apiConfig";
import EventDetails from "../components/eventdetails";

const OrganizerDetails = () => {
    const { organizerId } = useParams();
    const { participant } = useAuthContext();
    const [organizer, setOrganizer] = useState(null);
    const [events, setEvents] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [eventFilter, setEventFilter] = useState('all'); // all, upcoming, past

    useEffect(() => {
        const fetchOrganizerDetails = async () => {
            if (!participant) {
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(`${API_ENDPOINTS.PARTICIPANT.GET_PROFILE}/${organizerId}`, {
                    headers: { 'Authorization': `Bearer ${participant.token}` }
                });
                const data = await response.json();

                if (!response.ok) {
                    setError(data.error || 'Failed to load organizer details');
                    setOrganizer(null);
                    setEvents([]);
                    return;
                }

                setOrganizer(data.organizer);
                setEvents(data.events || []);
                setError(null);
            } catch (err) {
                setError('Failed to load organizer details');
                setOrganizer(null);
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOrganizerDetails();
    }, [participant, organizerId]);

    // Filtered events
    const filteredEvents = useMemo(() => {
        const now = new Date();
        if (eventFilter === 'upcoming') {
            return events.filter(event => new Date(event.start) > now);
        } else if (eventFilter === 'past') {
            return events.filter(event => new Date(event.start) <= now);
        }
        return events;
    }, [events, eventFilter]);

    if (!participant) {
        return <div className="pages">Please log in to view organizer details</div>;
    }

    if (loading) {
        return <div className="pages">Loading...</div>;
    }

    return (
        <div className="pages">
            {error && <div className="error">{error}</div>}
            {organizer && (
                <div style={{ marginBottom: '20px' }}>
                    <h2>{organizer.organizerName}</h2>
                    <p><strong>Category:</strong> {organizer.category}</p>
                    {organizer.contactEmail && <p><strong>Contact Email:</strong> {organizer.contactEmail}</p>}
                    {organizer.mobileNo && <p><strong>Mobile:</strong> {organizer.mobileNo}</p>}
                    {organizer.description && <p>{organizer.description}</p>}
                </div>
            )}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>Events</h3>
                    <select
                        value={eventFilter}
                        onChange={(e) => setEventFilter(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        <option value="all">All Events</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="past">Past</option>
                    </select>
                </div>
                {filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => (
                        <EventDetails key={event._id} event={event} hideRegistration />
                    ))
                ) : (
                    <p>No events found</p>
                )}
            </div>
        </div>
    );
};

export default OrganizerDetails;
