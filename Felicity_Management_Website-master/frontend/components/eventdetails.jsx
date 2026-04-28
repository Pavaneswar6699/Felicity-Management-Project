import { useState, useEffect } from "react";
import { useEventsContext } from "../hooks/useEventsContext";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import format from "date-fns/format";
import { useAuthContext } from "../hooks/useAuthContext";
import API_ENDPOINTS from "../src/config/apiConfig";
import EventUpdateForm from "./eventupdateform";
import DynamicFormBuilder from "./DynamicFormBuilder";

const EventDetails = ({ event, hideRegistration }) => {
    const { dispatch } = useEventsContext();
    const { organizer, participant } = useAuthContext();
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    const [ticketId, setTicketId] = useState('');
    const [scanMessage, setScanMessage] = useState(null);
    const [scanMessageType, setScanMessageType] = useState(null);
    const [scanningLoading, setScanningLoading] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [formData, setFormData] = useState({});
    const [formErrors, setFormErrors] = useState({});
    const [merchPaymentProof, setMerchPaymentProof] = useState(null);
    const [selectedSize, setSelectedSize] = useState('');

    // Check if participant is already registered for the event
    useEffect(() => {
        const checkRegistration = async () => {
            if (!participant) return;

            try {
                const response = await fetch(API_ENDPOINTS.PARTICIPANT.GET_MY_REGISTRATIONS, {
                    headers: {
                        'Authorization': `Bearer ${participant.token}`
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    const alreadyRegistered = data.some(
                        (reg) => reg.eventId._id === event._id
                    );
                    setIsRegistered(alreadyRegistered);
                }
            } catch (err) {
                console.error('Error checking registration:', err);
            }
        };

        checkRegistration();
    }, [participant, event._id]);


    // Fetch analytics when component mounts and organizer is logged in
    useEffect(() => {
        if (organizer && (event.status === 'published' || event.status === 'ongoing' || event.status === 'completed')) {
            fetchAnalytics();
        }
    }, [event._id, organizer]);

    const fetchAnalytics = async () => {
        setLoadingAnalytics(true);
        try {
            const response = await fetch(API_ENDPOINTS.ORGANIZER_EVENTS.GET_ANALYTICS(event._id), {
                headers: { 'Authorization': `Bearer ${organizer.token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setAnalytics(data);
            }
        } catch (err) {
            console.error('Error fetching analytics:', err);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const handleExportCSV = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.ORGANIZER_EVENTS.EXPORT_DATA(event._id), {
                headers: { 'Authorization': `Bearer ${organizer.token}` }
            });

            if (!response.ok) {
                setError('Failed to export CSV');
                return;
            }

            // Create blob from response and trigger download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${event.name}-registrations.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Error exporting CSV');
            console.error(err);
        }
    };

    const handleScan = async () => {
        if (!ticketId.trim()) {
            setScanMessage('Please enter a ticket ID');
            setScanMessageType('error');
            return;
        }

        setScanningLoading(true);
        try {
            const response = await fetch(API_ENDPOINTS.ORGANIZER_EVENTS.SCAN_TICKET(event._id), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${organizer.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ticketId: ticketId.trim() })
            });

            const data = await response.json();

            if (response.ok) {
                setScanMessage('Attendance marked successfully');
                setScanMessageType('success');
                setTicketId('');
                // Re-fetch analytics to update counts
                fetchAnalytics();
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

    const handleDelete = async () => {
        if (!organizer) {
            console.log('You must be logged in to delete an event');
            return;
        }
        const response = await fetch(API_ENDPOINTS.ORGANIZER_EVENTS.DELETE(event._id), {
            method: "DELETE",
            headers: { 'Authorization': `Bearer ${organizer.token}` }
        })
        const jsondata = await response.json();
        if (!response.ok) {
            console.log(jsondata.error);
        } else {
            console.log("Event deleted successfully");
            dispatch({ type: "DELETE_EVENT", payload: jsondata });
        }
    }

    const handleUpdate = () => {
        if (event.status === 'completed') {
            setError("Completed events cannot be edited.");
            return;
        }
        setIsUpdating(true);
    }
    const handleCancelUpdate = () => {
        setIsUpdating(false);
    }
    const handleUpdateSuccess = () => {
        setIsUpdating(false);
    }
    const handlePublish = async () => {
        if (!organizer) {
            console.log('You must be logged in to publish an event');
            return;
        }
        if (event.status === 'published') {
            setError("Event is already published.");
            return;
        }
        const response = await fetch(API_ENDPOINTS.ORGANIZER_EVENTS.PUBLISH(event._id), {
            method: "PATCH",
            headers: { 'Authorization': `Bearer ${organizer.token}` }
        })
        const jsondata = await response.json();
        if (!response.ok) {
            console.log(jsondata.error);
        } else {
            console.log("Event published successfully");
            dispatch({ type: "UPDATE_EVENT", payload: jsondata.event });
        }
    }

    // Form handlers for dynamic form
    const handleFormFieldChange = (fieldId, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldId]: value
        }));
        // Clear error for this field
        if (formErrors[fieldId]) {
            setFormErrors(prev => ({
                ...prev,
                [fieldId]: null
            }));
        }
    };

    const validateFormFields = () => {
        const newErrors = {};

        if (event.customFields) {
            event.customFields.forEach(field => {
                const value = formData[field._id];

                if (field.required) {
                    if (field.fieldType === 'checkbox') {
                        if (!Array.isArray(value) || value.length === 0) {
                            newErrors[field._id] = 'Please select at least one option';
                        }
                    } else if (field.fieldType === 'file') {
                        if (!value) {
                            newErrors[field._id] = 'Please upload a file';
                        }
                    } else {
                        if (!value || (typeof value === 'string' && value.trim() === '')) {
                            newErrors[field._id] = 'This field is required';
                        }
                    }
                }
            });
        }

        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        if (!participant) {
            setError('You must be logged in to register');
            return;
        }

        setError(null);

        // Validate form if event has custom fields
        if (event.type === 'normal' && event.customFields?.length > 0) {
            if (!validateFormFields()) {
                return;
            }
        }

        let quantity = 1;
        let sizeIndex = -1;

        // For merchandise events, prompt for quantity
        if (event.type === 'merchandise') {
            if (event.sizes && event.sizes.length > 0) {
                if (!selectedSize) {
                    setError('Please select a size');
                    return;
                }
                sizeIndex = event.sizes.indexOf(selectedSize);
            }

            const stockAvailable = event.stock && sizeIndex >= 0 ? event.stock[sizeIndex] : (event.stock && !Array.isArray(event.stock) ? event.stock : 1);
            const stockAvailableValue = Array.isArray(event.stock) ? stockAvailable : (event.stock || 1);

            const maxQuantity = event.purchaseLimit || stockAvailableValue;
            const quantityInput = prompt(`Enter quantity (max ${maxQuantity}):`, '1');

            if (quantityInput === null) {
                return; // User cancelled
            }

            quantity = parseInt(quantityInput);

            if (isNaN(quantity) || quantity < 1) {
                setError('Invalid quantity. Please enter a number greater than 0.');
                return;
            }

            if (event.purchaseLimit && quantity > event.purchaseLimit) {
                setError(`Maximum purchase limit is ${event.purchaseLimit}`);
                return;
            }

            if (event.stock && quantity > stockAvailableValue) {
                setError(`Not enough stock. Available: ${stockAvailableValue}`);
                return;
            }
        }

        if ((event.type === 'merchandise' || (event.type === 'normal' && event.regFee > 0)) && !(merchPaymentProof instanceof File)) {
            setError('Payment proof required');
            return;
        }

        const body = { quantity };
        if (selectedSize) body.selectedSize = selectedSize;
        let requestBody = JSON.stringify(body);
        let requestHeaders = {
            'Authorization': `Bearer ${participant.token}`,
            'Content-Type': 'application/json'
        };

        // Include form responses if event type is 'normal' and form was filled
        if (event.type === 'normal' && event.customFields?.length > 0) {
            const hasFileField = event.customFields.some(field => field.fieldType === 'file');
            const hasAnySelectedFile = event.customFields.some(field => field.fieldType === 'file' && formData[field._id] instanceof File);

            const formResponses = event.customFields.map(field => {
                let value = formData[field._id];

                if (field.fieldType === 'number') {
                    value = value ? Number(value) : 0;
                } else if (field.fieldType === 'checkbox') {
                    value = Array.isArray(value) ? value : [];
                } else if (field.fieldType === 'radio' || field.fieldType === 'dropdown') {
                    value = String(value || '');
                } else if (field.fieldType === 'file') {
                    value = '';
                } else {
                    value = String(value || '');
                }

                return {
                    label: field.label,
                    value: value
                };
            });

            body.formResponses = formResponses;

            const requiresMultipart = (hasFileField && hasAnySelectedFile) || event.regFee > 0;

            if (requiresMultipart) {
                const multipartBody = new FormData();
                multipartBody.append('quantity', String(quantity));
                multipartBody.append('formResponses', JSON.stringify(formResponses));

                if (event.regFee > 0) {
                    multipartBody.append('paymentProof', merchPaymentProof);
                }

                event.customFields.forEach(field => {
                    if (field.fieldType === 'file') {
                        const selectedFile = formData[field._id];
                        if (selectedFile instanceof File) {
                            multipartBody.append(field.label, selectedFile);
                        }
                    }
                });

                requestBody = multipartBody;
                requestHeaders = {
                    'Authorization': `Bearer ${participant.token}`
                };
            } else {
                requestBody = JSON.stringify(body);
            }
        } else if (event.type === 'merchandise' || (event.type === 'normal' && event.regFee > 0)) {
            const merchFormResponses = [{
                label: 'Upload Payment Proof',
                type: 'file',
                value: ''
            }];

            const multipartBody = new FormData();
            multipartBody.append('quantity', String(quantity));
            if (selectedSize) multipartBody.append('selectedSize', selectedSize);
            multipartBody.append('formResponses', JSON.stringify(merchFormResponses));
            multipartBody.append('paymentProof', merchPaymentProof);

            requestBody = multipartBody;
            requestHeaders = {
                'Authorization': `Bearer ${participant.token}`
            };
        }

        const response = await fetch(API_ENDPOINTS.PARTICIPANT.REGISTER_EVENT(event._id), {
            method: 'POST',
            headers: requestHeaders,
            body: requestBody
        });

        const jsondata = await response.json();

        if (!response.ok) {
            setError(jsondata.error || 'Failed to register');
        } else {
            alert(jsondata.message || 'Registration successful!');
            setIsRegistered(true);
            setFormData({}); // Reset form after successful registration
            setMerchPaymentProof(null);
            // Update event stock in local state if merchandise
            if (event.type === 'merchandise' && event.stock) {
                let updatedStock = event.stock;
                if (Array.isArray(event.stock)) {
                    updatedStock = [...event.stock];
                    if (sizeIndex >= 0) {
                        updatedStock[sizeIndex] -= quantity;
                    }
                } else {
                    updatedStock -= quantity;
                }
                const updatedEvent = {
                    ...event,
                    stock: updatedStock
                };
                dispatch({ type: 'UPDATE_EVENT', payload: updatedEvent });
            }
        }
    }

    if (isUpdating) {
        return (
            <div className="event-details">
                <EventUpdateForm event={event} onCancel={handleCancelUpdate} onUpdated={handleUpdateSuccess} />
            </div>
        );
    }
    return (
        <div className="event-details">
            <h4>{event.name}</h4>
            <p>{event.description}</p>
            <p><strong>Type:</strong> {event.type}</p>
            <p><strong>Eligibility:</strong> {event.eligibility}</p>
            {(event.organizerID?.organizerName || event.organizerName) && (
                <p><strong>Organizer:</strong> {event.organizerID?.organizerName || event.organizerName}</p>
            )}
            <p><strong>Start Date:</strong> {format(new Date(event.start), "PPpp")}</p>
            <p><strong>Registration Deadline:</strong> {format(new Date(event.regDeadline), "PPpp")}</p>
            <p><strong>End Date:</strong> {event.end ? format(new Date(event.end), "PPpp") : 'No end date'}</p>
            {event.eligibility && <p><strong>Eligibility:</strong> {event.eligibility}</p>}
            {event.regLimit && <p><strong>Registration Limit:</strong> {event.regLimit}</p>}
            <p><strong>Registration Fee:</strong> {event.regFee ? event.regFee : 'Free'}</p>
            {event.type === 'merchandise' && event.itemDetails && (
                <p><strong>Item Details:</strong> {event.itemDetails}</p>
            )}
            {event.sizes && event.sizes.length > 0 && <p><strong>Sizes:</strong> {event.sizes.join(', ')}</p>}
            {event.stock && event.stock.length > 0 && <p><strong>Stock:</strong> {Array.isArray(event.stock) ? event.stock.join(', ') : event.stock}</p>}
            {event.purchaseLimit && <p><strong>Purchase Limit:</strong> {event.purchaseLimit}</p>}
            <span className="event-status">{(event.status)}</span>
            <p><strong>Tags:</strong> {event.tags && event.tags.join(', ')}</p>

            {organizer && analytics && (
                <div className="event-analytics">
                    <p><strong>Total Registrations:</strong> {analytics.totalRegistrations}</p>
                    <p><strong>Attended:</strong> {analytics.attendedCount}</p>
                    <p><strong>Not Attended:</strong> {analytics.notAttendedCount}</p>
                    <p><strong>Revenue:</strong> ₹{analytics.revenue}</p>
                    <button className="export-csv-button" onClick={handleExportCSV}>Export CSV</button>
                </div>
            )}
            {organizer && loadingAnalytics && <p><em>Loading analytics...</em></p>}

            {organizer && (event.status === 'ongoing' || event.status === 'published') && (
                <div className="attendance-scanner">
                    <h5>Attendance Scanner</h5>
                    <input
                        type="text"
                        placeholder="Enter ticket ID"
                        value={ticketId}
                        onChange={(e) => setTicketId(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                    />
                    <button
                        className="scan-button"
                        onClick={handleScan}
                        disabled={scanningLoading}
                    >
                        {scanningLoading ? 'Scanning...' : 'Scan'}
                    </button>
                    {scanMessage && (
                        <div className={`scan-message ${scanMessageType}`}>
                            {scanMessage}
                        </div>
                    )}
                </div>
            )}

            {organizer && (
                <div className="event-actions">
                    {(event.status === 'draft' || event.status === 'published' || event.status === 'ongoing') && <span className="material-symbols-outlined" onClick={handleUpdate}>edit</span>}
                    {<span className="material-symbols-outlined" onClick={handleDelete}>delete</span>}
                </div>
            )}
            <p>{formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}</p>
            {organizer && event.status === 'draft' && <button className="publish-register-button" onClick={handlePublish}>Publish</button>}

            {!hideRegistration && participant && event.type === 'normal' && event.customFields?.length > 0 && !isRegistered && (
                <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                    <DynamicFormBuilder
                        formSchema={event.customFields}
                        formData={formData}
                        formErrors={formErrors}
                        onFieldChange={handleFormFieldChange}
                    />
                </div>
            )}

            {!hideRegistration && participant && (event.type === 'merchandise' || (event.type === 'normal' && event.regFee > 0)) && !isRegistered && (
                <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                    {event.type === 'merchandise' && event.sizes?.length > 0 && (
                        <div className="form-field-wrapper" style={{ marginBottom: '15px' }}>
                            <label>
                                Select Size
                                <span className="text-required">*</span>
                            </label>
                            <select
                                value={selectedSize}
                                onChange={(e) => setSelectedSize(e.target.value)}
                                className={!selectedSize && error === 'Please select a size' ? 'error' : ''}
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            >
                                <option value="">Select a size...</option>
                                {event.sizes.map((size, index) => {
                                    const available = event.stock ? event.stock[index] : 0;
                                    return (
                                        <option key={index} value={size} disabled={event.stock && available <= 0}>
                                            {size} {event.stock ? `(${available} left)` : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    )}
                    <div className="form-field-wrapper">
                        <label>
                            Upload Payment Proof
                            <span className="text-required">*</span>
                        </label>
                        <input
                            type="file"
                            onChange={(e) => setMerchPaymentProof(e.target.files?.[0] || null)}
                            className={!merchPaymentProof && error === 'Payment proof required' ? 'error' : ''}
                        />
                    </div>
                </div>
            )}

            {!hideRegistration && participant && event.status !== 'completed' && (
                <button className="publish-register-button" onClick={handleRegister} disabled={isRegistered || new Date(event.regDeadline) < new Date() || (Array.isArray(event.stock) && event.stock.length > 0 && event.stock.every(s => s === 0))}>{isRegistered ? 'Registered' : 'Register'}</button>
            )}
            {error && <div className="error">{error}</div>}
        </div>
    );
}

export default EventDetails;