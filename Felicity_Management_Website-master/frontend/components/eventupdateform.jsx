import { useEffect, useState } from "react";
import { useEventsContext } from "../hooks/useEventsContext";
import { useAuthContext } from "../hooks/useAuthContext";
import API_ENDPOINTS from "../src/config/apiConfig";

const toLocalInputValue = (value) => {
    if (!value) {
        return '';
    }
    const date = new Date(value);

    // Convert to target local timezone for display (IST)
    const localTime = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));

    if (Number.isNaN(localTime.getTime())) {
        return '';
    }
    const pad = (num) => String(num).padStart(2, '0');
    return `${localTime.getUTCFullYear()}-${pad(localTime.getUTCMonth() + 1)}-${pad(localTime.getUTCDate())}T${pad(localTime.getUTCHours())}:${pad(localTime.getUTCMinutes())}`;
};

const EventUpdateForm = ({ event, onCancel, onUpdated }) => {
    const { dispatch } = useEventsContext(); // using context for dispatch fn
    const { organizer } = useAuthContext(); // using context to get organizer details and token for authentication

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('');
    const [eligibility, setEligibility] = useState('');
    const [regDeadline, setRegDeadline] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [regLimit, setRegLimit] = useState('');
    const [regFee, setRegFee] = useState('');
    const [tags, setTags] = useState('');
    const [sizes, setSizes] = useState([]);
    const [stock, setStock] = useState([]);
    const [purchaseLimit, setPurchaseLimit] = useState('');
    const [itemDetails, setItemDetails] = useState('');
    const [status, setStatus] = useState('');
    const [customFields, setCustomFields] = useState([]);

    const [error, setError] = useState(null);
    const [emptyFields, setEmptyFields] = useState([]);

    const resetForm = () => {
        setName('');
        setDescription('');
        setType('');
        setEligibility('');
        setRegDeadline('');
        setStart('');
        setEnd('');
        setRegLimit('');
        setRegFee('');
        setTags('');
        setSizes('');
        setStock('');
        setPurchaseLimit('');
        setItemDetails('');
        setStatus('');
        setCustomFields([]);
    }

    useEffect(() => {
        if (!event) {
            return;
        }
        setName(event.name || '');
        setDescription(event.description || '');
        setType(event.type || '');
        setEligibility(event.eligibility || '');
        setRegDeadline(toLocalInputValue(event.regDeadline));
        setStart(toLocalInputValue(event.start));
        setEnd(toLocalInputValue(event.end));
        setRegLimit(event.regLimit ?? '');
        setRegFee(event.regFee ?? '');
        setTags(event.tags ? event.tags.join(', ') : '');
        setSizes(event.sizes ? event.sizes.join(', ') : '');
        setStock(event.stock ? event.stock.join(', ') : '');
        setPurchaseLimit(event.purchaseLimit ?? '');
        setItemDetails(event.itemDetails || '');
        setStatus(event.status || '');
        setCustomFields(event.customFields && Array.isArray(event.customFields) ? event.customFields : []);
    }, [event]);

    // Handler functions for customFields
    const handleCustomFieldChange = (index, fieldName, value) => {
        setCustomFields((prev) => {
            const updated = [...prev];
            updated[index][fieldName] = value;
            return updated;
        });
    };

    const handleAddCustomField = () => {
        setCustomFields((prev) => [...prev, {
            fieldId: Date.now(),
            label: '',
            fieldType: 'text',
            required: false,
            options: []
        }]);
    };

    // Update a custom field property
    const updateCustomField = (fieldId, property, value) => {
        setCustomFields(customFields.map(f =>
            f.fieldId === fieldId ? { ...f, [property]: value } : f
        ));
    };

    const handleRemoveCustomField = (index) => {
        setCustomFields((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (event.status === 'completed') {
            setError('Completed events cannot be edited.');
            return;
        }

        // Build eventData based on status
        let eventData = {};

        if (event.status === 'draft') {
            // Draft: all fields
            eventData = {
                name,
                description,
                eligibility,
                regDeadline: regDeadline ? new Date(regDeadline).toISOString() : '',
                start: start ? new Date(start).toISOString() : '',
                end: end ? new Date(end).toISOString() : '',
                regLimit,
                regFee,
                tags: typeof tags === 'string' && tags ? tags.split(',').map(tag => tag.trim()) : (Array.isArray(tags) ? tags : []),
                sizes: typeof sizes === 'string' && sizes ? sizes.split(',').map(size => size.trim()) : (Array.isArray(sizes) ? sizes : []),
                stock: typeof stock === 'string' && stock ? stock.split(',').map(s => parseInt(s.trim())) : (Array.isArray(stock) ? stock : []),
                purchaseLimit,
                itemDetails,
                customFields
            }
        } else if (event.status === 'published') {
            // Published: only description, regDeadline, regLimit, status
            eventData = { description };
            if (regDeadline) {
                eventData.regDeadline = new Date(regDeadline).toISOString();
            }
            if (regLimit !== '' && regLimit !== null && regLimit !== undefined) {
                eventData.regLimit = regLimit;
            }
            if (status) {
                eventData.status = status;
            }
        } else if (event.status === 'ongoing') {
            // Ongoing: only status
            eventData = status ? { status } : {};
        }

        if (!organizer) {
            setError('You must be logged in to update an event');
            return;
        }

        try {
            const response = await fetch(`/api/organizerEvents/${event._id}`, {
                method: 'PATCH',
                body: JSON.stringify(eventData),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${organizer.token}`
                }
            })
            const jsondata = await response.json();
            if (!response.ok) {
                setError(jsondata.error);
                setEmptyFields(Array.isArray(jsondata.emptyFields) ? jsondata.emptyFields : []);
            }
            else {
                try {
                    const updatedresponse = await fetch(`/api/organizerEvents/${event._id}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${organizer.token}`
                        }
                    });
                    const updatedEventData = await updatedresponse.json();
                    if (updatedresponse.ok) {
                        resetForm();
                        setError(null);
                        setEmptyFields([]);
                        dispatch({ type: 'UPDATE_EVENT', payload: updatedEventData });
                        if (onUpdated) {
                            onUpdated();
                        }
                        console.log("Event updated successfully");
                    } else {
                        setError('Failed to fetch updated event details.');
                    }
                } catch (fetchError) {
                    setError('Failed to fetch updated event details.');
                    console.error('Error fetching updated event:', fetchError);
                }
            }
        } catch (error) {
            setError('Failed to update event. Please try again later.');
            console.error('Error updating event:', error);
        }
    }

    const isEmptyField = (field) => Array.isArray(emptyFields) && emptyFields.includes(field);

    return (
        <form className="create" onSubmit={handleSubmit}>
            <h3>Update Event</h3>

            {/* Completed Events - Show disabled message */}
            {event.status === 'completed' && (
                <div className="error error-spacing">
                    This event is completed and cannot be edited.
                </div>
            )}

            {/* Draft Status - Show all fields */}
            {event.status === 'draft' && (
                <>
                    <label>Event Name: <span className="text-required">*</span></label>
                    <input
                        type="text"
                        onChange={(e) => setName(e.target.value)}
                        value={name}
                        className={isEmptyField('name') ? 'error' : ''}
                    />

                    <label>Description:</label>
                    <textarea
                        onChange={(e) => setDescription(e.target.value)}
                        value={description}
                    ></textarea>

                    <label>Eligibility:</label>
                    <input
                        type="text"
                        onChange={(e) => setEligibility(e.target.value)}
                        value={eligibility}
                    />

                    <label>Registration Deadline: <span className="text-required">*</span></label>
                    <input
                        type="datetime-local"
                        onChange={(e) => setRegDeadline(e.target.value)}
                        value={regDeadline}
                        className={isEmptyField('regDeadline') ? 'error' : ''}
                    />

                    <label>Start Date: <span className="text-required">*</span></label>
                    <input
                        type="datetime-local"
                        onChange={(e) => setStart(e.target.value)}
                        value={start}
                        className={isEmptyField('start') ? 'error' : ''}
                    />

                    <label>End Date:</label>
                    <input
                        type="datetime-local"
                        onChange={(e) => setEnd(e.target.value)}
                        value={end}
                    />

                    <label>Registration Limit:</label>
                    <input
                        type="number"
                        onChange={(e) => setRegLimit(e.target.value)}
                        value={regLimit}
                    />

                    <label>Registration Fee:</label>
                    <input
                        type="number"
                        onChange={(e) => setRegFee(e.target.value)}
                        value={regFee}
                    />

                    <label>Tags (comma separated):</label>
                    <input
                        type="text"
                        onChange={(e) => setTags(e.target.value)}
                        value={tags}
                    />

                    {type === 'merchandise' && (
                        <>
                            <label>Item Details:</label>
                            <textarea
                                onChange={(e) => setItemDetails(e.target.value)}
                                value={itemDetails}
                                rows="3"
                            ></textarea>

                            <label>Sizes (comma separated):</label>
                            <input
                                type="text"
                                onChange={(e) => setSizes(e.target.value)}
                                value={sizes}
                            />

                            <label>Stock (comma separated):</label>
                            <input
                                type="text"
                                onChange={(e) => setStock(e.target.value)}
                                value={stock}
                            />

                            <label>Purchase Limit:</label>
                            <input
                                type="number"
                                onChange={(e) => setPurchaseLimit(e.target.value)}
                                value={purchaseLimit}
                            />

                        </>
                    )}

                    {/* Custom Fields Section */}
                    <div className="custom-fields-section">
                        <h4>Custom Fields for Participants</h4>
                        {customFields && customFields.length > 0 && (
                            <div>
                                {customFields.map((field, index) => (
                                    <div className="custom-field-item" key={field.fieldId || index}>
                                        <div className="custom-field-inputs">
                                            <input
                                                type="text"
                                                placeholder="Field Label"
                                                value={field.label}
                                                onChange={(e) => handleCustomFieldChange(index, 'label', e.target.value)}
                                                className="field-input-flex-1"
                                            />
                                            <select
                                                value={field.fieldType}
                                                onChange={(e) => handleCustomFieldChange(index, 'fieldType', e.target.value)}
                                                className="field-select-flex-half"
                                            >
                                                <option value="text">Text</option>
                                                <option value="textarea">Textarea</option>
                                                <option value="number">Number</option>
                                                <option value="dropdown">Dropdown</option>
                                                <option value="radio">Radio</option>
                                                <option value="checkbox">Checkbox</option>
                                                <option value="file">File</option>
                                            </select>
                                            <label className="field-required-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={field.required}
                                                    onChange={(e) => handleCustomFieldChange(index, 'required', e.target.checked)}
                                                />
                                                Required
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCustomField(index)}
                                                className="btn-remove-custom-field"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        {['dropdown', 'radio', 'checkbox'].includes(field.fieldType) && (
                                            <div className="field-options">
                                                <input
                                                    type="text"
                                                    placeholder="Options (comma-separated)"
                                                    value={field.optionsInput || ''}
                                                    onChange={(e) => updateCustomField(field.fieldId, 'optionsInput', e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={handleAddCustomField}
                            className="btn-add-custom-field"
                        >
                            + Add Field
                        </button>
                    </div>
                </>
            )}

            {/* Published Status - Show description, regDeadline, regLimit, status */}
            {event.status === 'published' && (
                <>
                    <label>Description:</label>
                    <textarea
                        onChange={(e) => setDescription(e.target.value)}
                        value={description}
                    ></textarea>

                    <label>Registration Deadline (Can extend):</label>
                    <input
                        type="datetime-local"
                        onChange={(e) => setRegDeadline(e.target.value)}
                        value={regDeadline}
                        className={isEmptyField('regDeadline') ? 'error' : ''}
                    />

                    <label>Registration Limit (Can increase):</label>
                    <input
                        type="number"
                        onChange={(e) => setRegLimit(e.target.value)}
                        value={regLimit}
                    />

                    <label>Status:</label>
                    <select
                        onChange={(e) => setStatus(e.target.value)}
                        value={status}
                    >
                        <option value="published">Published (Current)</option>
                        <option value="ongoing">Move to Ongoing</option>
                    </select>
                </>
            )}

            {/* Ongoing Status - Show only status field */}
            {event.status === 'ongoing' && (
                <>
                    <p className="text-muted">Ongoing events can only be marked as completed.</p>

                    <label>Status:</label>
                    <select
                        onChange={(e) => setStatus(e.target.value)}
                        value={status}
                    >
                        <option value="ongoing">Ongoing (Current)</option>
                        <option value="completed">Mark as Completed</option>
                    </select>
                </>
            )}

            {/* Submit button - only if not completed */}
            {event.status !== 'completed' && (
                <>
                    <br />
                    <button>Update Event</button> &nbsp;&nbsp;
                    {onCancel && (
                        <button type="button" onClick={onCancel}>
                            Cancel
                        </button>
                    )}
                </>
            )}

            {error && <div className="error">{error}</div>}
        </form>
    )
}

export default EventUpdateForm;