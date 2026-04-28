import { useEffect, useState } from "react";
import Fuse from "fuse.js";
import { useEventsContext } from "../hooks/useEventsContext";
import { useAuthContext } from "../hooks/useAuthContext";
import API_ENDPOINTS from "../src/config/apiConfig";
//components
import ParticipantEventCard from "../components/ParticipantEventCard"

const ParticipantHome = () => {
    // const [events, setEvents]=useState(null);
    // we are using the context to get the events and dispatch function for state management
    const { events, dispatch } = useEventsContext();
    const { participant } = useAuthContext();

    // Filter and pagination state
    const [search, setSearch] = useState('');
    const [type, setType] = useState('');
    const [eligibility, setEligibility] = useState('');
    const [upcomingOnly, setUpcomingOnly] = useState(false);
    const [sort, setSort] = useState('upcoming');
    const [completionFilter, setCompletionFilter] = useState('active');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [followedOnly, setFollowedOnly] = useState(false);
    const [trendingWindow, setTrendingWindow] = useState('all');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [refreshKey, setRefreshKey] = useState(0);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1); // Reset to first page on search change
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch events with filters
    useEffect(() => {
        const fetchParticipant = async () => {
            // Build query params
            const params = new URLSearchParams();
            if (type) params.append('type', type);
            if (eligibility) params.append('eligibility', eligibility);
            if (upcomingOnly) params.append('upcomingOnly', 'true');
            if (sort) params.append('sort', sort);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (followedOnly) params.append('followedOnly', 'true');
            if (sort === 'trending' && trendingWindow === '24h') {
                params.append('trendingWindow', '24h');
            }
            if (completionFilter === 'all') {
                params.append('includeCompleted', 'true');
            } else if (completionFilter === 'active') {
                params.append('isCompleted', 'false');
            } else if (completionFilter === 'completed') {
                params.append('isCompleted', 'true');
            }
            params.append('page', page.toString());
            params.append('limit', limit.toString());

            const queryString = params.toString();
            const url = `/api/participant/events${queryString ? `?${queryString}` : ''}`;

            const [eventsResponse, profileResponse] = await Promise.all([
                fetch(url, {
                    headers: { 'Authorization': `Bearer ${participant.token}` }
                }),
                fetch(API_ENDPOINTS.PARTICIPANT.GET_PROFILE, {
                    headers: { 'Authorization': `Bearer ${participant.token}` }
                })
            ]);

            const eventsResponseData = await eventsResponse.json();
            const profileData = await profileResponse.json();

            if (eventsResponse.ok) {
                // Handle both paginated and non-paginated responses
                let eventsData = [];
                if (Array.isArray(eventsResponseData)) {
                    // Simple array response (backward compatibility)
                    eventsData = eventsResponseData;
                } else if (eventsResponseData.events) {
                    // Paginated response
                    eventsData = eventsResponseData.events;
                    setTotalPages(eventsResponseData.totalPages || 1);
                }

                // Fuzzy search runs client-side to keep pagination intact
                let filteredEvents = eventsData;
                if (search && search.trim().length > 0) {
                    const fuse = new Fuse(eventsData, {
                        keys: ['name', 'description', 'tags', 'organizerID.organizerName'],
                        threshold: 0.4,
                        ignoreLocation: true
                    });
                    const results = fuse.search(search.trim()).map((result) => result.item._id);
                    const resultSet = new Set(results);
                    filteredEvents = eventsData.filter((event) => resultSet.has(event._id));
                }

                // Apply recommendation algorithm only when sort is not 'trending'
                if (sort !== 'trending') {
                    const followedIds = new Set(
                        (profileResponse.ok && profileData.followedOrganizers)
                            ? profileData.followedOrganizers.map((org) => org._id || org)
                            : []
                    );
                    const interestSet = new Set(
                        (profileResponse.ok && profileData.interests) ? profileData.interests : []
                    );
                    const scored = filteredEvents.map((event) => {
                        const organizerId = event.organizerID?._id || event.organizerID;
                        const organizerCategory = event.organizerID?.category;
                        let score = 0;
                        if (organizerId && followedIds.has(organizerId)) {
                            score += 5;
                        }
                        if (organizerCategory && interestSet.has(organizerCategory)) {
                            score += 3;
                        }
                        return { event, score };
                    });
                    const sortedEvents = scored
                        .sort((a, b) => {
                            if (b.score !== a.score) {
                                return b.score - a.score;
                            }
                            return new Date(a.event.start) - new Date(b.event.start);
                        })
                        .map((item) => item.event);
                    dispatch({ type: "SET_EVENTS", payload: sortedEvents });
                } else {
                    // For trending sort, use backend ordering
                    dispatch({ type: "SET_EVENTS", payload: filteredEvents });
                }
            }
        }

        if (participant) {
            fetchParticipant();
        }
    }, [dispatch, participant, search, type, eligibility, upcomingOnly, sort, completionFilter, startDate, endDate, followedOnly, trendingWindow, page, limit, refreshKey]);

    // Reset page when filters change
    const handleFilterChange = (setter) => (value) => {
        setPage(1);
        setter(value);
    };

    return (
        <div className="participant-browse">
            <div className="page-header">
                <h2>Events</h2>
                <button className="btn-refresh" onClick={() => { setRefreshKey(k => k + 1); setPage(1); }}>⟳ Refresh</button>
            </div>

            {/* Compact Filters */}
            <div className="browse-filters">
                {/* Row 1: Search + main dropdowns */}
                <div className="browse-filters-row">
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select value={type} onChange={(e) => handleFilterChange(setType)(e.target.value)}>
                        <option value="">All Types</option>
                        <option value="normal">Normal</option>
                        <option value="merchandise">Merchandise</option>
                    </select>
                    <select value={eligibility} onChange={(e) => handleFilterChange(setEligibility)(e.target.value)}>
                        <option value="All">All Eligibilities</option>
                        <option value="IIIT">IIIT Only</option>
                        <option value="Non-IIIT">Non-IIIT Only</option>
                    </select>
                    <select value={sort} onChange={(e) => handleFilterChange(setSort)(e.target.value)}>
                        <option value="upcoming">Upcoming</option>
                        <option value="trending">Trending</option>
                    </select>
                    <select value={completionFilter} onChange={(e) => handleFilterChange(setCompletionFilter)(e.target.value)}>
                        <option value="all">All</option>
                        <option value="active">Active Only</option>
                        <option value="completed">Completed Only</option>
                    </select>
                    {sort === 'trending' && (
                        <select value={trendingWindow} onChange={(e) => handleFilterChange(setTrendingWindow)(e.target.value)}>
                            <option value="all">Trending: All time</option>
                            <option value="24h">Trending: Last 24h</option>
                        </select>
                    )}
                </div>
                {/* Row 2: Date range + toggles + pagination */}
                <div className="browse-filters-row">
                    <label>
                        <input type="checkbox" checked={upcomingOnly} onChange={(e) => handleFilterChange(setUpcomingOnly)(e.target.checked)} />
                        Upcoming Only
                    </label>
                    <label>
                        <input type="checkbox" checked={followedOnly} onChange={(e) => handleFilterChange(setFollowedOnly)(e.target.checked)} />
                        Followed Clubs
                    </label>
                    <label>From <input type="date" value={startDate} onChange={(e) => handleFilterChange(setStartDate)(e.target.value)} /></label>
                    <label>To <input type="date" value={endDate} onChange={(e) => handleFilterChange(setEndDate)(e.target.value)} /></label>
                    <div className="pagination-controls">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
                        <span>Page {page} of {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
                    </div>
                </div>
            </div>

            {/* Events List */}
            {events && events.length > 0 ? (
                <div className="participant-events-grid">
                    {events.map((event) => (
                        <ParticipantEventCard key={event._id} event={event} />
                    ))}
                </div>
            ) : (
                <p>No events found</p>
            )}
        </div>
    );
}

export default ParticipantHome;