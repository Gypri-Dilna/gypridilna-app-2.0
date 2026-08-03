
import React, { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);
        const timer = setTimeout(() => {
            setVisible(false);
            // Allow time for fade out animation before calling onClose
            setTimeout(onClose, 300);
        }, 2700);

        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    const icon = type === 'success' ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );

    return (
        <div className={`fixed top-5 right-5 z-50 flex items-center p-4 rounded-lg shadow-lg text-white ${bgColor} transition-transform duration-300 ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
            {icon}
            <div className="ml-3 text-sm font-medium">
                {message}
            </div>
            <button onClick={onClose} className="ml-auto -mx-1.5 -my-1.5 bg-transparent rounded-lg p-1.5 inline-flex h-8 w-8 text-white hover:bg-white hover:bg-opacity-20 focus:outline-none">
                <span className="sr-only">Close</span>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};
