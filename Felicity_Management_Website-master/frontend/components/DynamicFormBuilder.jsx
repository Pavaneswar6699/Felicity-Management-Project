import { useState } from 'react';

const DynamicFormBuilder = ({ formSchema, formData, formErrors, onFieldChange }) => {
    if (!formSchema || formSchema.length === 0) {
        return null;
    }

    const handleCheckboxChange = (fieldId, option) => {
        const currentValues = formData[fieldId] || [];
        const newValues = currentValues.includes(option)
            ? currentValues.filter(item => item !== option)
            : [...currentValues, option];
        onFieldChange(fieldId, newValues);
    };

    const handleFileChange = (fieldId, file) => {
        onFieldChange(fieldId, file || null);
    };

    return (
        <div className="form-builder-container">
            <h4>Event Registration Form</h4>
            {formSchema.map((field) => (
                <div key={field._id} className="form-field-wrapper">
                    <label>
                        {field.label}
                        {field.required && <span className="text-required">*</span>}
                    </label>

                    {field.fieldType === 'text' && (
                        <input
                            type="text"
                            value={formData[field._id] || ''}
                            onChange={(e) => onFieldChange(field._id, e.target.value)}
                            placeholder={field.label}
                            className={formErrors[field._id] ? 'error' : ''}
                        />
                    )}

                    {field.fieldType === 'textarea' && (
                        <textarea
                            value={formData[field._id] || ''}
                            onChange={(e) => onFieldChange(field._id, e.target.value)}
                            placeholder={field.label}
                            rows={3}
                            className={formErrors[field._id] ? 'error' : ''}
                        />
                    )}

                    {field.fieldType === 'number' && (
                        <input
                            type="number"
                            value={formData[field._id] || ''}
                            onChange={(e) => onFieldChange(field._id, e.target.value)}
                            placeholder={field.label}
                            className={formErrors[field._id] ? 'error' : ''}
                        />
                    )}

                    {field.fieldType === 'dropdown' && (
                        <select
                            value={formData[field._id] || ''}
                            onChange={(e) => onFieldChange(field._id, e.target.value)}
                            className={formErrors[field._id] ? 'error' : ''}
                        >
                            <option value="">Select {field.label}</option>
                            {field.options && field.options.map((option, idx) => (
                                <option key={idx} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    )}

                    {field.fieldType === 'radio' && (
                        <div className="radio-group">
                            {field.options && field.options.map((option, idx) => (
                                <label key={idx} className="radio-label">
                                    <input
                                        type="radio"
                                        name={`radio-${field._id}`}
                                        value={option}
                                        checked={formData[field._id] === option}
                                        onChange={(e) => onFieldChange(field._id, e.target.value)}
                                    />
                                    {option}
                                </label>
                            ))}
                        </div>
                    )}

                    {field.fieldType === 'checkbox' && (
                        <div className="checkbox-group">
                            {field.options && field.options.map((option, idx) => (
                                <label key={idx} className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={(formData[field._id] || []).includes(option)}
                                        onChange={() => handleCheckboxChange(field._id, option)}
                                    />
                                    {option}
                                </label>
                            ))}
                        </div>
                    )}

                    {field.fieldType === 'file' && (
                        <input
                            type="file"
                            onChange={(e) => handleFileChange(field._id, e.target.files[0])}
                            className={formErrors[field._id] ? 'error' : ''}
                        />
                    )}

                    {formErrors[field._id] && (
                        <div className="field-error">{formErrors[field._id]}</div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default DynamicFormBuilder;
