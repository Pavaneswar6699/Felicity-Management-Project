import { useState } from "react";
import { useEventsContext } from "../hooks/useEventsContext";
import { useAuthContext } from "../hooks/useAuthContext";
import API_ENDPOINTS from "../src/config/apiConfig";

const EventForm = () => {
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
    const [sizes, setSizes] = useState('');
    const [stock, setStock] = useState('');
    const [purchaseLimit, setPurchaseLimit] = useState('');
    const [itemDetails, setItemDetails] = useState('');
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
        setCustomFields([]);
        setError(null);
        setEmptyFields([]);
    }

    // Add a new custom field
    const addCustomField = () => {
        const newField = {
            fieldId: Date.now() + Math.random(),
            label: '',
            fieldType: 'text',
            required: false,
            options: [],
            optionsInput: '' // for handling comma-separated options input
        };
        setCustomFields([...customFields, newField]);
    };

    // Remove a custom field
    const removeCustomField = (fieldId) => {
        setCustomFields(customFields.filter(f => f.fieldId !== fieldId));
    };

    // Update a custom field property
    const updateCustomField = (fieldId, property, value) => {
        setCustomFields(customFields.map(f =>
            f.fieldId === fieldId ? { ...f, [property]: value } : f
        ));
    };

    // Safe check for empty field
    const isEmptyField = (field) => Array.isArray(emptyFields) && emptyFields.includes(field);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate custom fields
        const processedCustomFields = customFields.map(field => {
            if (['dropdown', 'radio', 'checkbox'].includes(field.fieldType)) {
                const parsedOptions = (field.optionsInput || '')
                    .split(',')
                    .map(opt => opt.trim())
                    .filter(opt => opt.length > 0);

                return {
                    fieldId: field.fieldId,
                    label: field.label,
                    fieldType: field.fieldType,
                    required: field.required,
                    options: parsedOptions
                };
            }
            return field;
        });

        const parsedSizes = sizes ? sizes.split(',').map(size => size.trim()).filter(s => s) : [];
        const parsedStock = stock ? stock.split(',').map(s => s.trim() !== '' ? Number(s.trim()) : 0) : [];

        if (type === 'merchandise' && parsedSizes.length > 0 && parsedSizes.length !== parsedStock.length) {
            setError('Sizes and Stock must have the exact same number of comma-separated values');
            return;
        }

        const eventData = {
            name,
            description,
            type,
            eligibility,
            regDeadline: regDeadline ? new Date(regDeadline).toISOString() : '',
            start: start ? new Date(start).toISOString() : '',
            end: end ? new Date(end).toISOString() : '',
            regLimit,
            regFee,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            sizes: parsedSizes,
            stock: parsedStock,
            purchaseLimit,
            itemDetails,
            customFields: type === 'normal' ? processedCustomFields : []
        }

        if (!organizer) {
            setError('You must be logged in to create an event');
            return;
        }

        if (end && new Date(end) < new Date(start)) {
            setError('Event end time cannot be before start time');
            return;
        }

        try {
            const response = await fetch(API_ENDPOINTS.ORGANIZER_EVENTS.CREATE, {
                method: 'POST',
                body: JSON.stringify(eventData),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${organizer.token}`
                }
            })
            const jsondata = await response.json();
            if (!response.ok) {
                setError(jsondata.error);
                setEmptyFields(jsondata.emptyFields);
            }
            else {
                resetForm();
                setError(null);
                setEmptyFields([]);
                console.log('Event created successfully:', jsondata);
                dispatch({ type: 'CREATE_EVENT', payload: jsondata }); // dispatching the update
            }
        } catch (error) {
            setError('Failed to create event. Please try again later.');
            console.error('Error creating event:', error);
        }
    }

    return (
        <form className="create" onSubmit={handleSubmit}>
            <h3>Create a New Event</h3>
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

            <label>Type: <span className="text-required">*</span></label>
            <select
                name="type"
                onChange={(e) => setType(e.target.value)}
                value={type}
                className={isEmptyField('type') ? 'error' : ''}
            >
                <option value="">Select type...</option>
                <option value="normal">Normal</option>
                <option value="merchandise">Merchandise</option>
            </select>

            <label>Eligibility: <span className="text-required">*</span></label>
            <select
                name="eligibility"
                onChange={(e) => setEligibility(e.target.value)}
                value={eligibility}
                className={isEmptyField('eligibility') ? 'error' : ''}
            >
                <option value="">Select eligibility...</option>
                <option value="All">All</option>
                <option value="IIIT">IIIT</option>
                <option value="Non-IIIT">Non-IIIT</option>
            </select>

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

            <label>End Date: <span className="text-required">*</span></label>
            <input
                type="datetime-local"
                onChange={(e) => setEnd(e.target.value)}
                value={end}
                className={isEmptyField('end') ? 'error' : ''}
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

                    <label>Stock (comma separated, in exact order of sizes):</label>
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

            {type === 'normal' && (
                <div className="custom-fields-section">
                    <h4>Custom Form Fields (Optional)</h4>
                    <p className="help-text">Add fields to collect participant information</p>

                    {customFields.length > 0 && (
                        <div className="custom-fields-list">
                            {customFields.map((field) => (
                                <div key={field.fieldId} className="custom-field-item">
                                    <div className="custom-field-row">
                                        <input
                                            type="text"
                                            placeholder="Field Label"
                                            value={field.label}
                                            onChange={(e) => updateCustomField(field.fieldId, 'label', e.target.value)}
                                            className="field-label-input"
                                        />
                                        <select
                                            value={field.fieldType}
                                            onChange={(e) => updateCustomField(field.fieldId, 'fieldType', e.target.value)}
                                            className="field-type-select"
                                        >
                                            <option value="text">Text</option>
                                            <option value="textarea">Textarea</option>
                                            <option value="number">Number</option>
                                            <option value="dropdown">Dropdown</option>
                                            <option value="radio">Radio</option>
                                            <option value="checkbox">Checkbox</option>
                                            <option value="file">File</option>
                                        </select>
                                        <label className="field-required-label">
                                            <input
                                                type="checkbox"
                                                checked={field.required}
                                                onChange={(e) => updateCustomField(field.fieldId, 'required', e.target.checked)}
                                            />
                                            Required
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => removeCustomField(field.fieldId)}
                                            className="btn-remove-field"
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
                        onClick={addCustomField}
                        className="btn-add-field"
                    >
                        + Add Field
                    </button>
                </div>
            )}

            <button>Create Event</button>
            {error && <div className="error">{error}</div>}
        </form>
    )
}

export default EventForm;