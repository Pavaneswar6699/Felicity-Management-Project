import { useEffect, useState, useMemo } from "react";
import { useAuthContext } from "../hooks/useAuthContext";
import { format } from "date-fns";
import API_ENDPOINTS from "../src/config/apiConfig";

const ParticipantMyEvents = () => {
    const [registrations, setRegistrations] = useState([]);
    const [error, setError] = useState(null);
    const { participant } = useAuthContext();

    // Filter states
    const [statusFilter, setStatusFilter] = useState('all'); // all, unattended, attended, missed
    const [typeFilter, setTypeFilter] = useState('all'); // all, normal, merchandise

    const fetchRegistrations = async () => {
        if (!participant) return;

        try {
            const response = await fetch(API_ENDPOINTS.PARTICIPANT.GET_MY_REGISTRATIONS, {
                headers: { 'Authorization': `Bearer ${participant.token}` }
            });

            const data = await response.json();

            if (response.ok) {
                setRegistrations(data);
            } else {
                setError(data.error || 'Failed to fetch registrations');
            }
        } catch (err) {
            setError('Failed to fetch registrations');
        }
    };

    useEffect(() => {
        fetchRegistrations();
    }, [participant]);

    // Helper to get participation status
    const getParticipationStatus = (registration) => {
        if (registration.attended) return 'attended';
        const now = new Date();
        const eventStart = registration.eventId?.start ? new Date(registration.eventId.start) : null;
        const eventEnd = registration.eventId?.end ? new Date(registration.eventId.end) : null;

        if (eventEnd && now > eventEnd) return 'missed';
        if (eventStart && now >= eventStart) return 'unattended';
        return 'registered';
    };

    // Filtered registrations
    const filteredRegistrations = useMemo(() => {
        let filtered = [...registrations];

        // Status filter — uses same logic as getParticipationStatus
        if (statusFilter !== 'all') {
            filtered = filtered.filter(r => getParticipationStatus(r) === statusFilter);
        }

        // Type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(r => r.eventId?.type === typeFilter);
        }

        return filtered;
    }, [registrations, statusFilter, typeFilter]);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Ticket ID copied to clipboard!');
    };

    const handleDelete = async (registrationId) => {
        if (!window.confirm('Are you sure you want to delete this registration?')) {
            return;
        }

        try {
            const response = await fetch(`/api/participant/registrations/${registrationId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${participant.token}` }
            });

            const data = await response.json();

            if (response.ok) {
                setRegistrations(registrations.filter(r => r._id !== registrationId));
                alert('Registration deleted successfully');
            } else {
                setError(data.error || 'Failed to delete registration');
            }
        } catch (err) {
            setError('Failed to delete registration');
        }
    };

    const handleAddToCalendar = async (eventId, eventName) => {
        try {
            const response = await fetch(`/api/participant/events/${eventId}/calendar`, {
                headers: { 'Authorization': `Bearer ${participant.token}` }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to generate calendar');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `event_${eventName ? eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : eventId}.ics`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleGoogleCalendar = (event) => {
        if (!event) return;
        const text = encodeURIComponent(event.name || 'Event');
        const details = encodeURIComponent(event.description || '');
        const dates = `${new Date(event.start).toISOString().replace(/-|:|\.\d\d\d/g, "")}/${event.end ? new Date(event.end).toISOString().replace(/-|:|\.\d\d\d/g, "") : new Date(new Date(event.start).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "")}`;
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleOutlookCalendar = (event) => {
        if (!event) return;
        const subject = encodeURIComponent(event.name || 'Event');
        const body = encodeURIComponent(event.description || '');
        const startdt = new Date(event.start).toISOString();
        const enddt = event.end ? new Date(event.end).toISOString() : new Date(new Date(event.start).getTime() + 60 * 60 * 1000).toISOString();
        const url = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${subject}&startdt=${startdt}&enddt=${enddt}&body=${body}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="participant-my-events">
            <h2>My Registered Events</h2>
            {error && <div className="error">{error}</div>}

            {/* Filters */}
            <div className="my-events-filter-bar">
                <div className="my-events-filter-row">
                    <label>
                        <strong>Status:</strong>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="registered">Registered</option>
                            <option value="unattended">Unattended</option>
                            <option value="attended">Attended</option>
                            <option value="missed">Missed</option>
                        </select>
                    </label>
                    <label>
                        <strong>Type:</strong>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            <option value="normal">Normal</option>
                            <option value="merchandise">Merchandise</option>
                        </select>
                    </label>
                    <span className="my-events-count">
                        {filteredRegistrations.length} event(s) found
                    </span>
                </div>
            </div>

            {filteredRegistrations.length === 0 && !error && <p>No registrations found.</p>}
            <div className="registrations-grid">
                {filteredRegistrations.map((registration) => {
                    const participationStatus = getParticipationStatus(registration);
                    const statusStyles = {
                        registered: { bg: '#fff3cd', color: '#856404', label: 'Registered' },
                        attended: { bg: '#d4edda', color: '#155724', label: 'Attended' },
                        unattended: { bg: '#cfe2ff', color: '#084298', label: 'Unattended' },
                        missed: { bg: '#f8d7da', color: '#721c24', label: 'Missed' }
                    };
                    const currentStatus = statusStyles[participationStatus];
                    const registrationDecision = registration.status || 'pending';
                    const isAccepted = registrationDecision === 'accepted';
                    const selectedSize = registration.formResponses?.find(r => r.label === 'Selected Size')?.value;

                    return (
                        <div key={registration._id} className="registration-card">
                            <div className="reg-card-header">
                                <h3>{registration.eventId?.name || 'Event Name Unavailable'}</h3>
                                <div className="reg-card-actions">
                                    <button className="btn-calendar" onClick={() => handleAddToCalendar(registration.eventId?._id, registration.eventId?.name)}>Download .ics</button>
                                    <button className="btn-calendar-link" style={{ background: '#4285F4', color: 'white', border: 'none' }} onClick={() => handleGoogleCalendar(registration.eventId)}>Google</button>
                                    <button className="btn-calendar-link" style={{ background: '#0078D4', color: 'white', border: 'none' }} onClick={() => handleOutlookCalendar(registration.eventId)}>Outlook</button>
                                    <button className="btn-delete" onClick={() => handleDelete(registration._id)}>Delete</button>
                                </div>
                            </div>
                            <p className="reg-card-row"><strong>Type:</strong> <span className="badge-type">{registration.eventId?.type || 'N/A'}</span></p>
                            <p className="reg-card-row"><strong>Organizer:</strong> {registration.eventId?.organizerID?.organizerName || 'N/A'}</p>
                            <p className="reg-card-row"><strong>Status:</strong> <span className="badge-participation" style={{ background: currentStatus.bg, color: currentStatus.color }}>{currentStatus.label}</span></p>
                            <p className="reg-card-row-meta">
                                <strong>Registered:</strong> {registration.createdAt ? format(new Date(registration.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                            </p>
                            {registration.quantity && registration.quantity > 1 && (
                                <p className="reg-card-row"><strong>Quantity:</strong> <span className="badge-quantity">{registration.quantity}</span></p>
                            )}
                            {selectedSize && (
                                <p className="reg-card-row"><strong>Size:</strong> <span className="badge-size">{selectedSize}</span></p>
                            )}
                            <p className="reg-card-row"><strong>Registration Review:</strong> <span className={`registration-status-badge ${registrationDecision}`}>{registrationDecision}</span></p>
                            {isAccepted && registration.ticketId ? (
                                <>
                                    <p className="reg-card-row"><strong>Ticket ID:</strong> <code
                                        className="ticket-code"
                                        onClick={() => copyToClipboard(registration.ticketId)}
                                        title="Click to copy"
                                    >{registration.ticketId}</code></p>
                                    {registration.qrCode && (
                                        <div className="qr-code-section">
                                            <img src={registration.qrCode} alt="QR Code" />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="reg-card-row-meta">Ticket will be visible after organizer accepts your registration.</p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ParticipantMyEvents;
