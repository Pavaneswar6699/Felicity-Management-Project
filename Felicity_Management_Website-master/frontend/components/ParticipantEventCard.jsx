import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const ParticipantEventCard = ({ event }) => {
    const truncateDescription = (text, limit = 100) => {
        if (!text) return '';
        return text.length > limit ? text.substring(0, limit) + '...' : text;
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'normal':
                return '#1aac83';
            case 'merchandise':
                return '#ff9800';
            default:
                return '#666';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'draft':
                return '#999';
            case 'published':
                return '#1aac83';
            case 'ongoing':
                return '#2196f3';
            case 'completed':
                return '#999';
            default:
                return '#666';
        }
    };

    return (
        <Link to={`/participant/event/${event._id}`} style={{ textDecoration: 'none' }}>
            <div className="participant-event-card">
                <div className="card-header">
                    <h3>{event.name}</h3>
                    <div className="card-badges">
                        <span 
                            className="badge type-badge" 
                            style={{ backgroundColor: getTypeColor(event.type) }}
                        >
                            {event.type}
                        </span>
                        <span 
                            className="badge status-badge" 
                            style={{ backgroundColor: getStatusColor(event.status) }}
                        >
                            {event.status}
                        </span>
                    </div>
                </div>

                <div className="card-content">
                    <p className="organizer">
                        <strong>Organizer:</strong> {event.organizerID?.organizerName || 'N/A'}
                    </p>
                    
                    <p className="date">
                        <strong>Start:</strong> {format(new Date(event.start), 'MMM dd, yyyy HH:mm')}
                    </p>

                    <p className="description">
                        {truncateDescription(event.description, 100)}
                    </p>

                    {event.regFee && (
                        <p className="fee">
                            <strong>Fee:</strong> ₹{event.regFee}
                        </p>
                    )}
                </div>

                <div className="card-footer">
                    <span className="view-details">View Details →</span>
                </div>
            </div>
        </Link>
    );
};

export default ParticipantEventCard;
