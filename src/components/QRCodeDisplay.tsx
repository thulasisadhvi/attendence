import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import axios from 'axios';
import { ClipboardCopy, Share2, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

// Define the type for periodData for better type safety in TypeScript
interface PeriodData {
    year?: string;
    semester?: string;
    department?: string;
    section?: string;
    subject?: string;
    block?: string;
    room?: string;
    period?: string;
    facultyName?: string;
    token?: string;    // Add token to the interface
    timestamp?: string; // Add timestamp to the interface, crucial for timer
    status?: string;    // Add status to the interface
    [key: string]: string | undefined; // Allow for other string key-value pairs
}

const QRCodeDisplay = () => {
    // periodData can be null initially, an empty object {}, or a PeriodData object
    const [periodData, setPeriodData] = useState<PeriodData | null>(null);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' }>({ message: '', type: '' });
    const [isExpired, setIsExpired] = useState<boolean>(false); // New state for expiry
    const [timeLeft, setTimeLeft] = useState<number>(0); // New state for time left in seconds
    const [errorMessage, setErrorMessage] = useState<string>(''); // New state for specific errors

    // Function to display feedback messages
    const showFeedback = (message: string, type: 'success' | 'error') => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback({ message: '', type: '' }), 2500);
    };

    // New helper function to start or update the expiry timer
    const startExpiryTimer = (timestamp: string, status?: string) => {
        let interval: NodeJS.Timeout;

        if (status === "expired") {
            setIsExpired(true);
            setTimeLeft(0);
            setErrorMessage('QR Code is already marked as expired.');
            return () => {}; // Return an empty cleanup function as no interval was set
        }

        const entryTime = new Date(timestamp).getTime();
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
        const expiryTime = entryTime + fiveMinutes;

        interval = setInterval(() => {
            const currentTime = new Date().getTime();
            const remaining = expiryTime - currentTime;

            if (remaining <= 0) {
                clearInterval(interval);
                setIsExpired(true);
                setTimeLeft(0);
                setErrorMessage('QR Code has expired! Please ask the faculty to regenerate.');
            } else {
                setTimeLeft(Math.round(remaining / 1000)); // Update time left in seconds
            }
        }, 1000);

        return () => clearInterval(interval);
    };

    useEffect(() => {
        // Fetch period data from your backend's /latest endpoint
        axios.get<PeriodData>('http://localhost:5000/api/period/latest')
            .then(res => {
                const data = res.data;
                setPeriodData(data);
                setIsExpired(false); // Reset expired status on successful fetch

                if (data && data.timestamp) {
                    const cleanup = startExpiryTimer(data.timestamp, data.status);
                    return cleanup;
                } else if (Object.keys(data).length === 0) {
                    setErrorMessage('No period data available. Faculty needs to generate one.');
                    setIsExpired(true);
                } else if (!data.timestamp) {
                    setErrorMessage('Timestamp missing in period data, cannot start timer.');
                    setIsExpired(true); // Treat as invalid for display
                }
            })
            .catch(err => {
                console.error('Failed to fetch period data', err);
                const backendMessage = err.response?.data?.message;
                if (backendMessage && backendMessage.includes('No attendance data saved yet')) {
                    setErrorMessage('No QR code generated yet. Please ask the faculty to generate one.');
                } else if (backendMessage && backendMessage.includes('malformed')) {
                    setErrorMessage('Error: Corrupt data file on server. Please contact support.');
                } else {
                    setErrorMessage(backendMessage || 'Failed to load period data due to a network error.');
                }
                setPeriodData({}); // Set to empty object to trigger the "No Period Data Available" message
                setIsExpired(true); // Mark as expired/invalid on fetch error
                showFeedback('Failed to load period data.', 'error');
            });
    }, []);

    // Show loading message if periodData is null (initial state before fetch completes)
    if (periodData === null) {
        return (
            <div className="text-center mt-10 text-gray-500 text-lg">
                Fetching period details... hang tight 🚀
            </div>
        );
    }

    // If periodData is an empty object (no periods saved yet or fetch error), show a message
    // Also include isExpired or errorMessage to display specific expiry/error messages
    if (Object.keys(periodData).length === 0 || errorMessage || isExpired) {
        return (
            <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow-xl rounded-2xl border border-gray-100 text-center">
                <AlertTriangle className="w-10 h-10 mx-auto text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-700 mb-2">
                    {isExpired ? 'QR Code Status' : 'No Period Data Available'}
                </h2>
                <p className="text-red-600 font-semibold">
                    {errorMessage || 'Please submit period details from the form to generate a QR code.'}
                </p>
                {feedback.message && (
                    <div className={`mt-5 text-center flex items-center justify-center gap-2 text-sm font-medium ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {feedback.message}
                    </div>
                )}
            </div>
        );
    }

    // --- MODIFIED SECTION ---
    // The QR code value will still be the full periodData object for now,
    // as your current backend /api/period endpoint expects the full data or at least the token to retrieve it.
    // However, the `shareLink` will now only contain the token.
    const qrCodeValue = JSON.stringify(periodData); // Keep QR code value as full object for your current /api/period endpoint to work
    const shareLink = `${window.location.origin}/verf?token=${periodData.token}`; // <-- Changed to use token

    const handleCopy = async () => {
        if (isExpired) {
            showFeedback('QR link is expired and cannot be copied.', 'error');
            return;
        }
        try {
            await navigator.clipboard.writeText(shareLink);
            showFeedback('Link copied to clipboard!', 'success');
        } catch (err) {
            console.error('Failed to copy link using navigator.clipboard:', err);
            showFeedback('Failed to copy link.', 'error');
        }
    };

    const handleShare = async () => {
        if (isExpired) {
            showFeedback('QR link is expired and cannot be shared.', 'error');
            return;
        }
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Attendance QR Link',
                    text: 'Scan the QR or click the link below:',
                    url: shareLink,
                });
            } catch (err: any) {
                console.error('Sharing failed or was cancelled:', err);
                showFeedback('Sharing was cancelled or failed.', 'error');
            }
        } else {
            showFeedback('Sharing not supported on this browser.', 'error');
        }
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow-xl rounded-2xl border border-gray-100">
            <h2 className="text-2xl font-bold text-indigo-700 text-center mb-6">Your Attendance QR Code</h2>

            {isExpired ? (
                <div className="flex justify-center items-center bg-red-50 p-4 rounded-xl shadow-inner mb-6 flex-col">
                    <AlertTriangle className="w-12 h-12 text-red-600 mb-3" />
                    <p className="text-lg font-semibold text-red-700">QR Code Expired!</p>
                    <p className="text-sm text-red-600">Please ask the faculty to regenerate a new QR code.</p>
                </div>
            ) : (
                <>
                    <div className="flex justify-center bg-gray-50 p-4 rounded-xl shadow-inner mb-6">
                        {/* The QR code itself will still embed the full periodData object. */}
                        {/* This is because your backend's /api/period endpoint (for QR scanning) */}
                        {/* expects the full data (or at least the token within that data) to retrieve the entry. */}
                        {qrCodeValue && <QRCode value={qrCodeValue} size={180} />}
                    </div>

                    <div className="text-center text-gray-600 text-sm mb-6 flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4" />
                        QR expires in: <span className="font-semibold text-indigo-700">{minutes}:{seconds < 10 ? '0' : ''}{seconds}</span>
                    </div>
                </>
            )}

            <div className="bg-gray-50 p-4 rounded-xl text-gray-700 text-sm mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Period Info:</h3>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {Object.entries(periodData).map(([key, value]) => (
                        (key !== 'token' && key !== 'timestamp' && key !== 'status') && (
                            <li key={key}>
                                <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
                            </li>
                        )
                    ))}
                </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={handleCopy}
                    disabled={isExpired}
                    className={`flex items-center justify-center gap-2 flex-1 py-2 px-4 rounded-lg transition ${isExpired ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    <ClipboardCopy className="w-5 h-5" /> Copy Link
                </button>

                <button
                    onClick={handleShare}
                    disabled={isExpired}
                    className={`flex items-center justify-center gap-2 flex-1 py-2 px-4 rounded-lg transition ${isExpired ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                    <Share2 className="w-5 h-5" /> Share Link
                </button>
            </div>

            {feedback.message && (
                <div className={`mt-5 text-center flex items-center justify-center gap-2 text-sm font-medium ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {feedback.message}
                </div>
            )}
        </div>
    );
};

export default QRCodeDisplay;