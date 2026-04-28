import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";
import { useEventsContext } from "../hooks/useEventsContext";
import { format } from "date-fns";
import API_ENDPOINTS from "../src/config/apiConfig";
import EventUpdateForm from "../components/eventupdateform";
import FormResponsesViewer from "../components/FormResponsesViewer";
import QRScanner from "../src/components/QRScanner";
import DiscussionForum from "../components/DiscussionForum";

const OrganizerEventDetails = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { organizer } = useAuthContext();
    const { dispatch } = useEventsContext();

    const [event, setEvent] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [ticketId, setTicketId] = useState('');
    const [scanMessage, setScanMessage] = useState(null);
    const [scanMessageType, setScanMessageType] = useState(null);
    const [scanningLoading, setScanningLoading] = useState(false);
    const [selectedRegistration, setSelectedRegistration] = useState(null);
    const [showResponsesViewer, setShowResponsesViewer] = useState(false);
    const [registrationActionLoading, setRegistrationActionLoading] = useState(false);
    const [isScannerVisible, setIsScannerVisible] = useState(false);

    const getRegistrationStatusClass = (status) => {
        if (!status) return 'pending';
        return String(status).toLowerCase();
    };

    // Fetch event details and analytics
    const fetchEventData = async () => {
        if (!organizer || !eventId) return;

        setLoading(true);
        try {
            // Fetch event details
            const eventResponse = await fetch(API_ENDPOINTS.ORGANIZER_EVENTS.GET_BY_ID(eventId), {
                headers: { 'Authorization': `Bearer ${organizer.token}` }
            });

            if (!eventResponse.ok) {
                throw new Error('Event not found');
            }

            const eventData = await eventResponse.json();
            setEvent(eventData);

            // Fetch analytics
            const analyticsResponse = await fetch(API_ENDPOINTS.ORGANIZER_EVENTS.GET_ANALYTICS(eventId), {
                headers: { 'Authorization': `Bearer ${organizer.token}` }
            });

            if (analyticsResponse.ok) {
                const analyticsData = await analyticsResponse.json();
                setAnalytics(analyticsData);
            }

            // Fetch registrations
            const registrationsResponse = await fetch(API_ENDPOINTS.ORGANIZER_EVENTS.GET_REGISTRATIONS(eventId), {
                headers: { 'Authorization': `Bearer ${organizer.token}` }
            });

            if (registrationsResponse.ok) {
                const registrationsData = await registrationsResponse.json();
                setRegistrations(registrationsData);
            }

            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load event details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEventData();
    }, [organizer, eventId]);

    const handleScan = async () => {
        if (!ticketId.trim()) {
            setScanMessage('Please enter a ticket ID');
            setScanMessageType('error');
            return;
        }

        setScanningLoading(true);
        try {
            const response = await fetch(`/api/organizerEvents/${eventId}/scan`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${organizer.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ticketId: ticketId.trim() })
            });

            const data = await response.json();

            if (response.ok) {
                setScanMessage('✓ Attendance marked successfully!');
                setScanMessageType('success');
                setTicketId('');
                // Refresh analytics and registrations
                fetchEventData();
            } else {
                setScanMessage(data.error || 'Failed to scan ticket');
                setScanMessageType('error');
            }
        } catch (err) {
            setScanMessage('Error scanning ticket');
            setScanMessageType('error');
            console.error(err);
        } finally {
            setScanningLoading(false);
        }
    };

    const handleManualAttendance = async (registrationId) => {
        if (!window.confirm('Are you sure you want to manually mark attendance for this participant?')) return;

        setRegistrationActionLoading(true);
        try {
            const response = await fetch(`/api/organizerEvents/registrations/${registrationId}/attend`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${organizer.token}`
                }
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to mark attendance manually');
            }

            console.log('Attendance manually marked successfully!');
            // Refresh data
            fetchEventData();
            // Just show a quick alert to confirm if needed
        } catch (err) {
            alert(err.message || 'Error marking attendance');
        } finally {
            setRegistrationActionLoading(false);
        }
    };

    const handleExportCSV = async () => {
        try {
            console.log('Export CSV - Starting export for event:', eventId);
            console.log('Export CSV - Request URL:', `/api/organizerEvents/${eventId}/export`);

            const response = await fetch(`/api/organizerEvents/${eventId}/export`, {
                headers: { 'Authorization': `Bearer ${organizer.token}` }
            });

            console.log('Export CSV - Response status:', response.status);
            console.log('Export CSV - Response headers:', response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Export CSV - Error response:', errorText);
                setError(`Failed to export CSV: ${response.status} ${errorText}`);
                return;
            }

            const blob = await response.blob();
            console.log('Export CSV - Blob size:', blob.size, 'bytes');
            console.log('Export CSV - Blob type:', blob.type);

            if (blob.size === 0) {
                console.error('Export CSV - Blob is empty');
                setError('Export failed: Empty file received');
                return;
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${event?.name}-registrations.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            console.log('Export CSV - Download triggered successfully');
        } catch (err) {
            console.error('Export CSV - Exception:', err);
            setError(`Error exporting CSV: ${err.message}`);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;

        try {
            const response = await fetch(`/api/organizerEvents/${eventId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${organizer.token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to delete event');
            }

            dispatch({ type: 'DELETE_EVENT', payload: event });
            navigate('/');
        } catch (err) {
            setError('Failed to delete event');
            console.error(err);
        }
    };

    const handleUpdate = () => {
        if (event?.status === 'completed') {
            setError("Completed events cannot be edited.");
            return;
        }
        setIsUpdating(true);
    };

    const handleCancelUpdate = () => {
        setIsUpdating(false);
    };

    const handleUpdateSuccess = () => {
        setIsUpdating(false);
    };

    const handlePublish = async () => {
        if (event?.status === 'published') {
            setError("Event is already published.");
            return;
        }

        try {
            const response = await fetch(`/api/organizerEvents/${eventId}/publish`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${organizer.token}` }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to publish event');
            }

            setEvent(data.event);
            dispatch({ type: 'UPDATE_EVENT', payload: data.event });
        } catch (err) {
            setError(err.message);
            console.error(err);
        }
    };

    const handleRegistrationDecision = async (decision) => {
        if (!selectedRegistration?._id || !organizer) return;

        setRegistrationActionLoading(true);
        try {
            const response = await fetch(`/api/organizerEvents/registrations/${selectedRegistration._id}/${decision}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${organizer.token}`
                }
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `Failed to ${decision} registration`);
            }

            setRegistrations(prev => prev.map(reg => (
                reg._id === data._id ? { ...reg, status: data.status } : reg
            )));
            setSelectedRegistration(prev => prev ? { ...prev, status: data.status } : prev);
            setError(null);

            // Refresh analytics
            fetchEventData();
        } catch (err) {
            setError(err.message || 'Failed to update registration status');
        } finally {
            setRegistrationActionLoading(false);
        }
    };

    if (loading) return <div className="event-details-page">Loading event details...</div>;
    if (!event) return <div className="event-details-page">Event not found</div>;
    if (isUpdating) {
        return (
            <div className="event-details-page">
                <EventUpdateForm event={event} onCancel={handleCancelUpdate} onUpdated={handleUpdateSuccess} />
            </div>
        );
    }

    return (
        <div className="event-details-page">
            {error && <div className="error">{error}</div>}

            {/* Event Details Section */}
            <section className="event-details-section">
                <h2>{event.name}</h2>
                <p>{event.description}</p>

                <div className="event-info-grid">
                    <div>
                        <p><strong>Type:</strong> {event.type}</p>
                        <p><strong>Status:</strong> <span className={`status-badge ${event.status}`}>{event.status}</span></p>
                        <p><strong>Eligibility:</strong> {event.eligibility || 'N/A'}</p>
                        <p><strong>Registration Limit:</strong> {event.regLimit || 'Unlimited'}</p>
                    </div>
                    <div>
                        <p><strong>Start Date:</strong> {format(new Date(event.start), 'PPpp')}</p>
                        <p><strong>End Date:</strong> {event.end ? format(new Date(event.end), 'PPpp') : 'No end date'}</p>
                        <p><strong>Registration Deadline:</strong> {format(new Date(event.regDeadline), 'PPpp')}</p>
                        <p><strong>Registration Fee:</strong> {event.regFee ? `₹${event.regFee}` : 'Free'}</p>
                    </div>
                </div>

                {event.type === 'merchandise' && (
                    <div className="merchandise-info">
                        <p><strong>Item Details:</strong> {event.itemDetails}</p>
                        <p><strong>Sizes Available:</strong> {event.sizes.join(', ')}</p>
                        <p><strong>Stock:</strong> {event.stock.join(', ')}</p>
                        <p><strong>Purchase Limit:</strong> {event.purchaseLimit || 'Unlimited'}</p>
                    </div>
                )}

                {event.tags && event.tags.length > 0 && (
                    <p><strong>Tags:</strong> {event.tags.join(', ')}</p>
                )}

                <div className="action-buttons">
                    <button onClick={handleUpdate} className="btn-primary">Edit</button>
                    <button onClick={handleDelete} className="btn-danger">Delete</button>
                    {event.status === 'draft' && (
                        <button onClick={handlePublish} className="btn-success">Publish</button>
                    )}
                    <button onClick={handleExportCSV} className="btn-secondary">Export CSV</button>
                </div>
            </section>

            {/* Analytics Section */}
            {analytics && (
                <section className="event-details-section">
                    <h3>Analytics</h3>
                    <div className="analytics-grid">
                        <div className="analytics-card blue">
                            <p>Total Registrations</p>
                            <p>{analytics.totalRegistrations}</p>
                        </div>
                        <div className="analytics-card green">
                            <p>Attended</p>
                            <p>{analytics.attendedCount}</p>
                        </div>
                        <div className="analytics-card orange">
                            <p>Not Attended</p>
                            <p>{analytics.notAttendedCount}</p>
                        </div>
                        <div className="analytics-card pink">
                            <p>Revenue</p>
                            <p>₹{analytics.revenue}</p>
                        </div>
                    </div>
                </section>
            )}

            {/* Ticket Verification Section */}
            {(event.status === 'ongoing' || event.status === 'published') && (
                <section className="event-details-section ticket-verification">
                    <h3>🎫 Ticket Verification & Attendance</h3>
                    <p className="ticket-instruction-text">Scan participant tickets to mark attendance in real-time.</p>

                    <div>
                        <label className="input-label">Ticket ID</label>
                        <div className="ticket-input-group">
                            <input
                                type="text"
                                placeholder="Scan or enter ticket ID here"
                                value={ticketId}
                                onChange={(e) => setTicketId(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                                autoFocus
                            />
                            <button
                                onClick={handleScan}
                                disabled={scanningLoading}
                                className="btn-success"
                            >
                                {scanningLoading ? 'Verifying...' : 'Verify & Mark'}
                            </button>
                        </div>
                    </div>

                    {scanMessage && (
                        <div className={`scan-message ${scanMessageType}`}>
                            {scanMessage}
                        </div>
                    )}

                    <div className="qr-container">
                        {!isScannerVisible ? (
                            <button
                                onClick={() => setIsScannerVisible(true)}
                                className="qr-scan-button"
                                disabled={event.status === 'completed'}
                            >
                                Start QR Scan
                            </button>
                        ) : (
                            <QRScanner
                                eventId={eventId}
                                organizerToken={organizer.token}
                                onClose={() => setIsScannerVisible(false)}
                                onScanSuccessCallback={() => {
                                    // Refresh analytics and registrations
                                    fetchEventData();
                                }}
                            />
                        )}
                    </div>
                </section>
            )}

            {/* Participant List Section */}
            <section className="event-details-section">
                <div className="participants-header">
                    <h3 className="participants-title">Participants ({registrations.length})</h3>
                    <button
                        onClick={fetchEventData}
                        className="btn-secondary btn-icon"
                        disabled={loading || registrationActionLoading}
                        title="Refresh Participants List"
                    >
                        🔄 Refresh
                    </button>
                </div>
                {registrations.length === 0 ? (
                    <p>No registrations yet</p>
                ) : (
                    <div className="table-responsive">
                        <table className="participants-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Registered On</th>
                                    <th>Attendance</th>
                                    {event.type === 'normal' && <th>Status</th>}
                                    {event.type === 'normal' && <th>Action</th>}
                                    {event.type === 'merchandise' && <th>Status</th>}
                                    {(event.type === 'merchandise') && <th>Payment Proof</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {registrations.map((reg, idx) => (
                                    <tr key={reg._id}>
                                        <td>
                                            {reg.participantId?.firstName && reg.participantId?.lastName
                                                ? `${reg.participantId.firstName} ${reg.participantId.lastName}`
                                                : reg.participantId?.firstName || 'N/A'}
                                        </td>
                                        <td>{reg.participantId?.email || 'N/A'}</td>
                                        <td>
                                            {reg.createdAt ? format(new Date(reg.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                                        </td>
                                        <td>
                                            <span className={`attendance-badge ${reg.attended ? 'attended' : 'not-attended'}`}>
                                                {reg.attended ? 'Attended' : 'Not Attended'}
                                            </span>
                                        </td>
                                        {event.type === 'normal' && (
                                            <td>
                                                <span className={`registration-status-badge ${getRegistrationStatusClass(reg.status || 'pending')}`}>
                                                    {reg.status || 'pending'}
                                                </span>
                                            </td>
                                        )}
                                        {event.type === 'normal' && (
                                            <td>
                                                <button
                                                    className="btn-view-responses btn-block-margin"
                                                    onClick={() => {
                                                        setSelectedRegistration(reg);
                                                        setShowResponsesViewer(true);
                                                    }}
                                                >
                                                    {event.type === 'merchandise' ? 'View Proof' : (event.customFields?.length > 0 ? 'View Responses' : 'Review')}
                                                </button>
                                                {event.status === 'completed' && reg.status === 'accepted' && !reg.attended && (
                                                    <button
                                                        className="btn-success btn-block-small"
                                                        onClick={() => handleManualAttendance(reg._id)}
                                                        disabled={registrationActionLoading}
                                                    >
                                                        Mark Attend
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                        {event.type === 'merchandise' && (
                                            <td>
                                                <span className={`registration-status-badge ${getRegistrationStatusClass(reg.status || 'pending')}`}>
                                                    {reg.status || 'pending'}
                                                </span>
                                            </td>
                                        )}
                                        {event.type === 'merchandise' && (
                                            <td>
                                                <button
                                                    className="btn-view-responses btn-block-margin"
                                                    onClick={() => {
                                                        setSelectedRegistration(reg);
                                                        setShowResponsesViewer(true);
                                                    }}
                                                >
                                                    View Proof
                                                </button>
                                                {event.status === 'completed' && reg.status === 'accepted' && !reg.attended && (
                                                    <button
                                                        className="btn-success btn-block-small"
                                                        onClick={() => handleManualAttendance(reg._id)}
                                                        disabled={registrationActionLoading}
                                                    >
                                                        Mark Attend
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Form Responses Viewer Modal */}
            {showResponsesViewer && selectedRegistration && (
                <FormResponsesViewer
                    participantName={
                        selectedRegistration.participantId?.firstName && selectedRegistration.participantId?.lastName
                            ? `${selectedRegistration.participantId.firstName} ${selectedRegistration.participantId.lastName}`
                            : selectedRegistration.participantId?.firstName || 'Unknown'
                    }
                    responses={
                        event.type === 'merchandise'
                            ? [
                                ...(selectedRegistration.formResponses || []),
                                { label: 'Quantity', type: 'text', value: selectedRegistration.quantity || 1 }
                            ]
                            : (selectedRegistration.formResponses || [])
                    }
                    status={selectedRegistration.status || 'pending'}
                    actionLoading={registrationActionLoading}
                    onAccept={() => handleRegistrationDecision('accept')}
                    onReject={() => handleRegistrationDecision('reject')}
                    onClose={() => {
                        setShowResponsesViewer(false);
                        setSelectedRegistration(null);
                    }}
                />
            )}

            <DiscussionForum eventId={event._id} role="organizer" token={organizer.token} />
        </div>
    );
};

export default OrganizerEventDetails;
