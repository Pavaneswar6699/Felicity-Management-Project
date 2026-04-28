import { useState } from "react";
import { useOrganizersContext } from "../hooks/useOrganizersContext";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import { useAuthContext } from "../hooks/useAuthContext";
import API_ENDPOINTS from "../src/config/apiConfig";
import { useNavigate } from "react-router-dom";

const OrganizerDetails = ({ organizer }) => {
    const { dispatch } = useOrganizersContext();
    const { admin } = useAuthContext();
    const navigate = useNavigate();

    const handleDelete = async () => {
        if (!admin) {
            console.log('You must be logged in to delete an organizer');
            return;
        }
        const response = await fetch(API_ENDPOINTS.ADMIN.GET_ORGANIZER(organizer._id), {
            method: "DELETE",
            headers: { 'Authorization': `Bearer ${admin.token}` }
        })
        const jsondata = await response.json();
        if (!response.ok) {
            console.log(jsondata.error);
        } else {
            console.log("Organizer deleted successfully");
            dispatch({ type: "DELETE_ORGANIZER", payload: jsondata });
        }
    }

    let disableStatus = false;

    const handleDisable = async () => {
        if (!admin) {
            console.log('You must be logged in to delete an organizer');
            return;
        }
        const response = await fetch(`${API_ENDPOINTS.ADMIN.GET_ORGANIZER(organizer._id)}/disable`, {
            method: "PATCH",
            headers: { 'Authorization': `Bearer ${admin.token}` }
        })
        const jsondata = await response.json();
        if (!response.ok) {
            console.log(jsondata.error);
        } else {
            console.log("Organizer disabled successfully");
            dispatch({ type: "DISABLE_ORGANIZER", payload: jsondata });
            disableStatus = 1;
        }
    }

    const handleEnable = async () => {
        if (!admin) {
            console.log('You must be logged in to delete an organizer');
            return;
        }
        const response = await fetch(`${API_ENDPOINTS.ADMIN.GET_ORGANIZER(organizer._id)}/enable`, {
            method: "PATCH",
            headers: { 'Authorization': `Bearer ${admin.token}` }
        })
        const jsondata = await response.json();
        if (!response.ok) {
            console.log(jsondata.error);
        } else {
            console.log("Organizer enabled successfully");
            dispatch({ type: "ENABLE_ORGANIZER", payload: jsondata });
            disableStatus = 0;
        }
    }

    return (
        <div className="event-details">
            <h4>{organizer.organizerName}</h4>
            <p><strong>Email:</strong> {organizer.email}</p>
            {organizer.category && <p><strong>Category:</strong> {organizer.category}</p>}
            {organizer.description && <p><strong>Description:</strong> {organizer.description}</p>}
            {organizer.contactEmail && <p><strong>Contact:</strong> {organizer.contactEmail}</p>}
            {admin && (
                <div className="event-actions">
                    <button className="btn-primary view-history-btn" onClick={() => navigate(`/admin/organizers/${organizer._id}/history`)}>View History</button>
                    <span className="material-symbols-outlined" onClick={handleDelete}>delete</span>
                    {organizer.isDisabled ? (
                        <button className="btn-success" onClick={handleEnable} style={{ marginLeft: '10px', padding: '5px 10px' }}>Enable</button>
                    ) : (
                        <button className="btn-danger" onClick={handleDisable} style={{ marginLeft: '10px', padding: '5px 10px' }}>Disable</button>
                    )}
                </div>
            )}
            {organizer.createdAt && <p>{formatDistanceToNow(new Date(organizer.createdAt), { addSuffix: true })}</p>}
        </div>
    );
}

export default OrganizerDetails;