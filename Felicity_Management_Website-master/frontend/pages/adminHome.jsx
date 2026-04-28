import { useEffect, useState } from "react";
import { useOrganizersContext } from "../hooks/useOrganizersContext";
import { useAuthContext } from "../hooks/useAuthContext";
import API_ENDPOINTS from "../src/config/apiConfig";
//components
import OrganizerDetails from "../components/organizerdetails";

const AdminHome = () => {
    // const [organizers, setOrganizers]=useState(null);
    // we are using the context to get the organizers and dispatch function for state management
    const { organizers, dispatch } = useOrganizersContext();
    const { admin } = useAuthContext();
    const [error, setError] = useState(null);
    const [organizerName, setOrganizerName] = useState('');
    const [category, setCategory] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    useEffect(() => {
        const fetchAdmin = async () => {
            const response = await fetch(API_ENDPOINTS.ADMIN.GET_ORGANIZERS, {
                headers: { 'Authorization': `Bearer ${admin.token}` }
            });
            const jsondata = await response.json();
            if (response.ok) {
                // setOrganizers(jsondata);
                dispatch({ type: "SET_ORGANIZERS", payload: jsondata });
            }
        }

        if (admin) {
            fetchAdmin();
        }
    }, [dispatch, admin, refreshKey]); // added dispatch and admin to dependencies to avoid warnings

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!admin) {
            setError('You must be logged in to create an organizer');
            return;
        }

        if (!contactEmail.trim()) {
            setError('Contact email is required');
            return;
        }

        if (!isValidEmail(contactEmail.trim())) {
            setError('Please enter a valid contact email');
            return;
        }
        try {
            const response = await fetch(API_ENDPOINTS.ADMIN.GET_ORGANIZERS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${admin.token}`
                },
                body: JSON.stringify({
                    organizerName,
                    category,
                    contactEmail: contactEmail.trim().toLowerCase()
                })
            });
            const jsondata = await response.json();
            if (!response.ok) {
                setError(jsondata.error);
            } else {
                setOrganizerName('');
                setCategory('');
                setContactEmail('');
                setError(null);
                // add the new organizer to the context state
                dispatch({ type: "CREATE_ORGANIZER", payload: jsondata });
                console.log('Organizer created successfully:', jsondata);
                alert(`Organizer created successfully. Email: ${jsondata.email}, Password: ${jsondata.plainPassword}`);
            }
        } catch (err) {
            setError('Network error. Please try again.');
        }
    }
    return (
        <>
            <div className="homepage">
                <div className="organizers">
                    <div className="page-header">
                        <h2>Organizers</h2>
                        <button className="btn-refresh" onClick={() => setRefreshKey(k => k + 1)}>⟳ Refresh</button>
                    </div>
                    {organizers && organizers.map((organizer) => (
                        <OrganizerDetails key={organizer._id} organizer={organizer} />
                    ))}
                </div>
                <div className="create-organizer">
                    <h2>Create New Organizer</h2>
                    <form className="create" onSubmit={handleSubmit}>
                        <label>Organizer Name</label>
                        <input
                            type="text" placeholder="Organizer Name" value={organizerName} onChange={(e) => setOrganizerName(e.target.value)} />
                        <label>Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                            <option value="">Select Category</option>
                            <option value="Coding">Coding</option>
                            <option value="Design & Theory">Design & Theory</option>
                            <option value="Cultural">Cultural</option>
                            <option value="Sports & Games">Sports & Games</option>
                            <option value="Student Body">Student Body</option>
                            <option value="Councils & Committees">Councils & Committees</option>
                            <option value="Other">Other</option>
                        </select>
                        <label>Contact Email</label>
                        <input
                            type="email"
                            placeholder="Contact Email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            required
                        />
                        <button>Create Organizer</button>
                        {error && <div className="error">{error}</div>}
                    </form>
                </div>
            </div>
        </>
    );
}

export default AdminHome;