'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const WhatsappIcon = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [notification, setNotification] = useState(true);

    const phoneNumber = "+917386440344";
    const defaultMessage = "Hi there! How can we help you today?";

    useEffect(() => {
        setIsVisible(true); // Show immediately
        // Optional: Add notification after 30 seconds
        const timer = setTimeout(() => {
            setNotification(true);
        }, 30000);
        return () => clearTimeout(timer);
    }, []);

    const detectDevice = () => {
        const userAgent = navigator.userAgent || navigator.vendor;
        return /iPad|iPhone|iPod/.test(userAgent);
    };

    const openWhatsApp = () => {
        const textToSend = message || defaultMessage;
        const encodedMessage = encodeURIComponent(textToSend);
        const isIOS = detectDevice();
        
        let whatsappURL;
        
        if (isIOS) {
            // For iOS devices, use the universal link format
            whatsappURL = `https://wa.me/${phoneNumber.replace(/[^\d]/g, '')}?text=${encodedMessage}`;
        } else {
            // For Android and other devices
            whatsappURL = `https://wa.me/${phoneNumber.replace(/[^\d]/g, '')}?text=${encodedMessage}`;
        }

        // Open in new tab/window
        window.open(whatsappURL, '_blank');
        
        // Close the chat box
        setIsOpen(false);
        setMessage('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            openWhatsApp();
        }
    };

    const handleButtonClick = () => {
        setIsOpen(!isOpen);
        setNotification(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] font-sans">
            {/* WhatsApp Button */}
            <div className="relative">
                <div 
                    className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-all duration-200 animate-bounce"
                    onClick={handleButtonClick}
                >
                    <svg 
                        width="28" 
                        height="28" 
                        viewBox="0 0 24 24" 
                        fill="white"
                    >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.785"/>
                    </svg>
                </div>
                
                {/* Notification badge */}
                {notification && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-white text-xs font-bold">1</span>
                    </div>
                )}
            </div>

            {/* Chat Box */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border overflow-hidden animate-slide-up">
                    {/* Header */}
                    <div className="bg-[#075E54] text-white p-4 rounded-t-2xl">
                        <div className="flex items-center">
                            <div className="relative">
                                <Image 
                                    src="/epix-wa-icon.png" 
                                    alt="Epix Infra" 
                                    width={40}
                                    height={40}
                                    className="rounded-full mr-3"
                                />
                                <div className="absolute bottom-0 right-2 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-white">Epix Infra</h3>
                                <p className="text-xs text-green-200">Typically replies instantly</p>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="ml-auto text-white hover:text-gray-300 text-xl font-light"
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    {/* Message Area */}
                    <div className="p-4 bg-[#e5ddd5] min-h-[120px]" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4d4d4' fill-opacity='0.1'%3E%3Cpath d='M0 0h40v40H0z'/%3E%3C/g%3E%3C/svg%3E")`
                    }}>
                        {/* Default Message Bubble */}
                        <div className="mb-3">
                            <div className="bg-white rounded-lg rounded-bl-none p-3 shadow-sm max-w-[250px] relative">
                                <div className="absolute -bottom-1 -left-1 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white"></div>
                                <p className="text-sm text-gray-800 leading-relaxed">{defaultMessage}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-[#f0f0f0] border-t">
                        <div className="flex items-end space-x-2">
                            <div className="flex-1 bg-white rounded-full border border-gray-300 px-4 py-2">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type your message..."
                                    className="w-full outline-none text-sm"
                                />
                            </div>
                            <button
                                onClick={openWhatsApp}
                                className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center hover:bg-[#20b358] transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
export default WhatsappIcon
