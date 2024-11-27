"use client"

import { useEffect, useState } from "react";

const Preloader = () => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Hide preloader after 0.7 seconds
        const timer = setTimeout(() => setIsVisible(false), 700);
        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null; // Preloader disappears after animation

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
            {/* Sparks */}
            <div className="absolute w-full h-full">
                <div className="spark top-[20%] left-[30%]"></div>
                <div className="spark top-[50%] left-[60%]"></div>
                <div className="spark top-[70%] left-[40%]"></div>
            </div>

            {/* Circuit Animation */}
            <div className="relative">
                {/* Bulbs */}
                <div className="bulb absolute top-[-20px] left-[-40px]"></div>
                <div className="bulb absolute top-[40px] left-[60px]"></div>

                {/* Logo */}
                <div className="relative flex items-center justify-center">
                    <img
                        src="/logo.png"
                        alt="Epix Infra Logo"
                        className="logo w-40 opacity-0"
                    />
                </div>
            </div>
        </div>
    );
};

export default Preloader;
