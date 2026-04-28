import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import API_ENDPOINTS from '../config/apiConfig';

const QRScanner = ({ eventId, organizerToken, onClose, onScanSuccessCallback }) => {
    const [scanResult, setScanResult] = useState(null);
    const [scanError, setScanError] = useState(null);
    const [isScanning, setIsScanning] = useState(false);

    const scannerRef = useRef(null);

    useEffect(() => {
        if (!isScanning) return;

        // Prevent duplicate initialization
        if (scannerRef.current) return;

        const scanner = new Html5QrcodeScanner(
            "qr-reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                rememberLastUsedCamera: true
            },
            false
        );

        scannerRef.current = scanner;

        const onScanSuccess = async (decodedText) => {
            try {
                await scanner.clear();
            } catch {}

            scannerRef.current = null;
            setIsScanning(false);

            try {
                const response = await fetch(API_ENDPOINTS.ORGANIZER_EVENTS.SCAN_TICKET(eventId), {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${organizerToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ ticketId: decodedText })
                });

                const data = await response.json();

                if (response.ok) {
                    setScanResult('✓ Attendance marked successfully!');
                    setScanError(null);
                    onScanSuccessCallback?.();
                } else {
                    setScanError(data.error || 'Failed to scan ticket');
                    setScanResult(null);
                }
            } catch {
                setScanError('Network error while processing ticket');
                setScanResult(null);
            }
        };

        scanner.render(onScanSuccess, () => {});

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(() => {});
                scannerRef.current = null;
            }
        };

    }, [isScanning]); // ONLY depend on isScanning

    const handleStartScan = () => {
        setScanResult(null);
        setScanError(null);
        setIsScanning(true);
    };

    const handleScanNext = () => {
        setScanResult(null);
        setScanError(null);
        setIsScanning(true);
    };

    return (
        <div className="qr-scanner-container">
            <div className="qr-header">
                <h3>Scan Ticket</h3>
                <button onClick={onClose} className="qr-close-button">
                    Close Scanner
                </button>
            </div>

            {!isScanning && !scanResult && !scanError && (
                <button onClick={handleStartScan} className="qr-scan-button">
                    Start Scanning
                </button>
            )}

            {isScanning && <div id="qr-reader" />}

            {!isScanning && (scanResult || scanError) && (
                <div className="qr-result-container">
                    {scanResult && <div className="qr-result-success">{scanResult}</div>}
                    {scanError && <div className="qr-result-error">⚠️ {scanError}</div>}
                    <button onClick={handleScanNext} className="qr-scan-button">
                        Scan Next Ticket
                    </button>
                </div>
            )}
        </div>
    );
};

export default QRScanner;