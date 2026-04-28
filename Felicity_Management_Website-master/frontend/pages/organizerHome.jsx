import { useEffect, useState, useMemo } from "react";
import Fuse from "fuse.js";
import { Link } from "react-router-dom";
import { useEventsContext } from "../hooks/useEventsContext";
import { useAuthContext } from "../hooks/useAuthContext";
import { format } from "date-fns";
import API_ENDPOINTS from "../src/config/apiConfig";
//components
import EventForm from "../components/eventform";

const OrganizerHome = () => {
    const { events, dispatch } = useEventsContext();
    const { organizer } = useAuthContext();
    const [eventAnalytics, setEventAnalytics] = useState({});
    const [loadingAnalytics, setLoadingAnalytics] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // Filter state
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchOrganizer = async () => {
            const response = await fetch(API_ENDPOINTS.ORGANIZER_EVENTS.GET_ALL, {
                headers: { 'Authorization': `Bearer ${organizer.token}` }
            });
            const jsondata = await response.json();
            if (response.ok) {
                dispatch({ type: "SET_EVENTS", payload: jsondata });
            }
        }

        if (organizer) {
            fetchOrganizer();
        }
    }, [dispatch, organizer, refreshKey]);

    // Fetch analytics for all events to show registration count on cards
    useEffect(() => {
        if (!organizer || !events || events.length === 0) {
            setLoadingAnalytics(false);
            return;
        }

        const fetchAllAnalytics = async () => {
            setLoadingAnalytics(true);
            const analytics = {};

            for (const event of events) {
                try {
                    const response = await fetch(API_ENDPOINTS.ORGANIZER_EVENTS.GET_ANALYTICS(event._id), {
                        headers: { 'Authorization': `Bearer ${organizer.token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        analytics[event._id] = data.totalRegistrations || 0;
                    }
                } catch (err) {
                    console.error(`Failed to fetch analytics for event ${event._id}:`, err);
                    analytics[event._id] = 0;
                }
            }

            setEventAnalytics(analytics);
            setLoadingAnalytics(false);
        };

        fetchAllAnalytics();
    }, [organizer, events]);

    // Derive filtered events (AND logic, client-side only)
    const filteredEvents = useMemo(() => {
        let result = (events || []).filter((event) => {
            if (statusFilter && event.status !== statusFilter) return false;
            if (typeFilter && event.type !== typeFilter) return false;
            return true;
        });

        if (search.trim()) {
            const fuse = new Fuse(result, {
                keys: ['name', 'description'],
                threshold: 0.4,
                ignoreLocation: true,
            });
            result = fuse.search(search.trim()).map((r) => r.item);
        }

        return result;
    }, [events, statusFilter, typeFilter, search]);

    return (
        <div className="organizer-home">
            <div className="organizer-home-header">
                <div className="page-header">
                    <h2>My Events</h2>
                    <button className="btn-refresh" onClick={() => setRefreshKey(k => k + 1)}>⟳ Refresh</button>
                </div>
                <p>
                    Total: {events?.length || 0} event(s) • Click on any event to view details
                </p>
            </div>

            {/* Main Grid: Events Left, Form Right */}
            <div className="organizer-home-layout">
                {/* Events Grid - Left Column */}
                <div>
                    {/* Filter Bar */}
                    {events && events.length > 0 && (
                        <div className="filter-bar">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="ongoing">Ongoing</option>
                                <option value="completed">Completed</option>
                            </select>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <option value="">All Types</option>
                                <option value="normal">Normal</option>
                                <option value="merchandise">Merchandise</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Search by name or description..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="organizer-events-grid">
                        {filteredEvents.map((event) => (
                            <Link
                                key={event._id}
                                to={`/organizer/event/${event._id}`}
                                className="organizer-event-card"
                            >
                                <div className="organizer-event-card-content">
                                    <h3>
                                        {event.name}
                                    </h3>
                                    <p>
                                        <strong>Type:</strong> <span className="event-type-badge">{event.type}</span>
                                    </p>
                                    <p>
                                        <strong>Status:</strong> <span className={`status-badge ${event.status}`}>{event.status}</span>
                                    </p>
                                    <p>
                                        <strong>Start Date:</strong> {format(new Date(event.start), 'MMM dd, yyyy')}
                                    </p>
                                </div>
                                <div className="organizer-event-card-footer">
                                    <div className="registration-count">
                                        <strong>Registrations:</strong> <span className="registration-count-number">
                                            {loadingAnalytics ? '...' : (eventAnalytics[event._id] || 0)}
                                        </span>
                                    </div>
                                    <div className="card-arrow">→</div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {events && events.length > 0 && filteredEvents.length === 0 && (
                        <div className="organizer-empty-state">
                            <p>No events match the selected filters</p>
                        </div>
                    )}

                    {(!events || events.length === 0) && (
                        <div className="organizer-empty-state">
                            <p>No events yet</p>
                            <p>Create your first event using the form on the right →</p>
                        </div>
                    )}
                </div>

                {/* Event Form - Right Column */}
                <section className="organizer-form-sidebar">
                    <EventForm />
                </section>
            </div>
        </div>
    );
}

export default OrganizerHome;