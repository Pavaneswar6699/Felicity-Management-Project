const FormResponsesViewer = ({ participantName, responses, status = 'pending', actionLoading = false, onAccept, onReject, onClose }) => {
    const currentStatus = status || 'pending';
    const isPending = currentStatus === 'pending';

    const renderActionSection = () => (
        <div className="responses-action-section">
            <div className="responses-status-row">
                <span className="responses-status-label">Status:</span>
                <span className={`registration-status-badge ${currentStatus}`}>{currentStatus}</span>
            </div>
            <div className="responses-action-buttons">
                <button
                    className="btn-primary"
                    onClick={onAccept}
                    disabled={!isPending || actionLoading}
                >
                    {actionLoading && isPending ? 'Updating...' : 'Accept'}
                </button>
                <button
                    className="btn-danger"
                    onClick={onReject}
                    disabled={!isPending || actionLoading}
                >
                    {actionLoading && isPending ? 'Updating...' : 'Reject'}
                </button>
            </div>
        </div>
    );

    if (!responses || responses.length === 0) {
        return (
            <div className="popup-overlay" onClick={onClose}>
                <div className="popup-panel" onClick={(e) => e.stopPropagation()}>
                    <div className="popup-header">
                        <h3>Form Responses - {participantName}</h3>
                        <button className="btn-close" onClick={onClose}>×</button>
                    </div>
                    <div className="popup-body">
                        <p>No form responses available for this participant.</p>
                        {renderActionSection()}
                    </div>
                </div>
            </div>
        );
    }

    const resolveFileUrl = (fileValue) => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        if (!fileValue || typeof fileValue !== 'string') return '';
        if (fileValue.startsWith('http') || fileValue.startsWith('data:')) return fileValue;
        if (fileValue.startsWith('/api/')) return `${apiUrl}${fileValue}`;
        if (fileValue.startsWith('/uploads/')) return `${apiUrl}/api${fileValue}`;
        if (fileValue.startsWith('/')) return `${apiUrl}/api${fileValue}`;
        return `${apiUrl}/api/uploads/${fileValue}`;
    };

    const renderValue = (response) => {
        if (response.type === 'checkbox' && Array.isArray(response.value)) {
            return response.value.join(', ') || 'None selected';
        }

        if (response.type === 'file') {
            const fileValue = response.value;
            if (!fileValue) return '-';

            // Handle Cloudinary object format
            if (typeof fileValue === 'object' && fileValue.url) {
                return <a href={fileValue.url} target="_blank" rel="noopener noreferrer">View File</a>;
            }

            // Handle legacy string format
            if (typeof fileValue === 'string') {
                const fileUrl = resolveFileUrl(fileValue);
                const isUrl = fileUrl.startsWith('/') || fileUrl.startsWith('http');
                if (isUrl) {
                    return <a href={fileUrl} target="_blank" rel="noopener noreferrer">View File</a>;
                }
                return <span title="Base64 encoded file">File uploaded</span>;
            }
        }

        if (response.type === 'textarea') {
            return <div className="response-textarea">{String(response.value || '')}</div>;
        }

        // Catch-all to prevent React from crashing when rendering objects
        if (typeof response.value === 'object' && response.value !== null) {
            return JSON.stringify(response.value);
        }

        return String(response.value || '-');
    };

    return (
        <div className="popup-overlay" onClick={onClose}>
            <div className="popup-panel" onClick={(e) => e.stopPropagation()}>
                <div className="popup-header">
                    <h3>Form Responses - {participantName}</h3>
                    <button className="btn-close" onClick={onClose}>×</button>
                </div>
                <div className="popup-body">
                    <table className="responses-table">
                        <thead>
                            <tr>
                                <th>Field</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {responses.map((response, idx) => (
                                <tr key={idx}>
                                    <td className="response-label">{response.label}</td>
                                    <td className="response-value">{renderValue(response)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {renderActionSection()}
                </div>
            </div>
        </div>
    );
};

export default FormResponsesViewer;
