import { useState, useEffect } from 'react';
import API_ENDPOINTS from '../src/config/apiConfig';

const OrganizerAlerts = ({ organizer }) => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (organizer && organizer.token) {
            fetchAlerts();
            // Check for new alerts every 5 seconds
            const interval = setInterval(fetchAlerts, 5000);
            return () => clearInterval(interval);
        }
    }, [organizer]);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const response = await fetch(API_ENDPOINTS.ORGANIZER.GET_PASSWORD_CHANGE_REQUESTS, {
                headers: {
                    'Authorization': `Bearer ${organizer.token}`
                }
            });

            const data = await response.json();
            console.log('Alerts response:', data);
            if (response.ok) {
                setAlerts(Array.isArray(data) ? data : []);
            } else {
                console.error('Error fetching alerts:', data.error);
                setAlerts([]);
            }
        } catch (err) {
            console.error('Failed to fetch alerts', err);
            setAlerts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleClearAlerts = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.ORGANIZER.GET_PASSWORD_CHANGE_REQUESTS, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${organizer.token}`
                }
            });

            if (response.ok) {
                setAlerts([]);
            }
        } catch (err) {
            console.error('Failed to clear alerts', err);
        }
    };

    if (alerts.length === 0) {
        return null;
    }

    return (
        <div style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '6px',
            padding: '15px',
            marginBottom: '20px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>Alerts</h4>
                    {alerts.map((alert, index) => (
                        <p key={index} style={{ margin: '8px 0', color: '#856404' }}>
                            {alert.message}
                        </p>
                    ))}
                </div>
                <div style={{display: 'flex', gap: '8px', marginLeft: '15px'}}>
                    <button
                        onClick={fetchAlerts}
                        disabled={loading}
                        style={{
                            background: '#007bff',
                            border: '1px solid #0056b3',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                    <button
                        onClick={handleClearAlerts}
                        style={{
                            background: '#ffc107',
                            border: '1px solid #856404',
                            color: '#856404',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrganizerAlerts;
