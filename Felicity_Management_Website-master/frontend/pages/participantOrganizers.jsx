import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";
import API_ENDPOINTS from "../src/config/apiConfig";

const ParticipantOrganizers = () => {
    const { participant } = useAuthContext();
    const [organizers, setOrganizers] = useState([]);
    const [followingIds, setFollowingIds] = useState(new Set());
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!participant) {
                setLoading(false);
                return;
            }
            try {
                const [organizersResponse, profileResponse] = await Promise.all([
                    fetch(API_ENDPOINTS.PARTICIPANT.GET_ORGANIZERS, {
                        headers: { 'Authorization': `Bearer ${participant.token}` }
                    }),
                    fetch(API_ENDPOINTS.PARTICIPANT.GET_PROFILE, {
                        headers: { 'Authorization': `Bearer ${participant.token}` }
                    })
                ]);
                const organizersData = await organizersResponse.json();
                const profileData = await profileResponse.json();

                if (organizersResponse.ok) {
                    setOrganizers(organizersData);
                } else {
                    setError(organizersData.error || 'Failed to load organizers');
                }

                if (profileResponse.ok && profileData.followedOrganizers) {
                    const ids = new Set(profileData.followedOrganizers.map((org) => org._id || org));
                    setFollowingIds(ids);
                }
            } catch (err) {
                setError('Failed to load organizers');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [participant]);

    const handleToggleFollow = async (organizerId) => {
        const updatedIds = new Set(followingIds);
        const isCurrentlyFollowing = followingIds.has(organizerId);
        
        if (isCurrentlyFollowing) {
            updatedIds.delete(organizerId);
        } else {
            updatedIds.add(organizerId);
        }
        
        setFollowingIds(updatedIds);
        setError(null);

        try {
            const response = await fetch(API_ENDPOINTS.PARTICIPANT.UPDATE_PROFILE, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${participant.token}`
                },
                body: JSON.stringify({
                    followedOrganizers: Array.from(updatedIds)
                })
            });
            const data = await response.json();
            if (!response.ok) {
                // Revert on error
                setFollowingIds(followingIds);
                setError(data.error || 'Failed to update follow status');
            }
        } catch (err) {
            // Revert on error
            setFollowingIds(followingIds);
            setError('Failed to update follow status');
        }
    };

    if (!participant) {
        return <div className="pages">Please log in to view organizers</div>;
    }

    if (loading) {
        return <div className="pages">Loading...</div>;
    }

    return (
        <div className="pages">
            <h2>Organizers</h2>
            {error && <div className="error">{error}</div>}
            <div className="organizer-grid">
                {organizers.map((organizer) => {
                    const isFollowing = followingIds.has(organizer._id);
                    return (
                        <Link
                            key={organizer._id}
                            to={`/participant/organizer/${organizer._id}`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                            <div className="organizer-card">
                                <h4>{organizer.organizerName}</h4>
                                <p><strong>Category:</strong> {organizer.category}</p>
                                {organizer.description && <p>{organizer.description}</p>}
                                <div className="profile-actions">
                                    <button
                                        className={isFollowing ? 'btn-secondary' : 'btn-primary'}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleToggleFollow(organizer._id);
                                        }}
                                    >
                                        {isFollowing ? 'Unfollow' : 'Follow'}
                                    </button>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default ParticipantOrganizers;
