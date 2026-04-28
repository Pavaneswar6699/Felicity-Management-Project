import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";
import API_ENDPOINTS from "../src/config/apiConfig";

const AdminOrganizerHistory = () => {
    const { organizerId } = useParams();
    const { admin } = useAuthContext();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [organizerDetails, setOrganizerDetails] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            if (!admin) return;

            try {
                const response = await fetch(API_ENDPOINTS.ADMIN.GET_ORGANIZER_PASSWORD_HISTORY(organizerId), {
                    headers: {
                        'Authorization': `Bearer ${admin.token}`
                    }
                });

                const json = await response.json();

                if (!response.ok) {
                    setError(json.error);
                } else {
                    setHistory(json);
                    if (json.length > 0) {
                        setOrganizerDetails(json[0].organizerId);
                    } else {
                        // fetch organizer details if history is empty
                        const orgResponse = await fetch(API_ENDPOINTS.ADMIN.GET_ORGANIZER(organizerId), {
                            headers: {
                                'Authorization': `Bearer ${admin.token}`
                            }
                        });
                        const orgJson = await orgResponse.json();
                        if (orgResponse.ok) {
                            setOrganizerDetails({
                                organizerName: orgJson.organizerName,
                                email: orgJson.email
                            });
                        }
                    }
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [admin, organizerId]);

    if (loading) return <div className="admin-history-container">Loading...</div>;
    if (error) return <div className="admin-history-container error">{error}</div>;

    return (
        <div className="admin-history-container">
            <div className="history-header">
                <button className="btn-secondary history-back-btn" onClick={() => navigate(-1)}>
                    Back to Dashboard
                </button>
                {organizerDetails && (
                    <div>
                        <h2>Password Reset History</h2>
                        <p><strong>Name:</strong> {organizerDetails.organizerName}</p>
                        <p><strong>Email:</strong> {organizerDetails.email}</p>
                    </div>
                )}
            </div>

            {history.length === 0 ? (
                <div className="history-empty">No history found</div>
            ) : (
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>Requested At</th>
                            <th>Status</th>
                            <th>Approved At</th>
                            <th>Rejected At</th>
                            <th>Admin Comments</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((record) => (
                            <tr key={record._id}>
                                <td>{new Date(record.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                                <td>
                                    <span className={`history-status-badge ${record.status}`}>
                                        {record.status}
                                    </span>
                                </td>
                                <td>{record.approvedAt ? new Date(record.approvedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '-'}</td>
                                <td>{record.rejectedAt ? new Date(record.rejectedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '-'}</td>
                                <td>{record.adminComments || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default AdminOrganizerHistory;
