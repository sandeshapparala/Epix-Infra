// src/components/Navbar/Navbar.jsx
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);


    // Toggle mobile menu
    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    // Close mobile menu when a link is clicked
    const handleLinkClick = () => {
        setIsOpen(false);
    };

    // Smooth scroll function using GSAP
    const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
        e.preventDefault();
        const targetElement = document.getElementById(target);
        if (targetElement) {
            gsap.to(window, {
                duration: 0.5,
                scrollTo: {
                    y: targetElement,
                    offsetY: 80, // Adjust if Navbar height changes
                },
                ease: 'power2.out',
            });
        }
    };

    // Close mobile menu on window resize if screen is larger than mobile
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768 && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isOpen]);

    const navLinks = [
        { name: 'Home', target: 'hero' },
        { name: 'About Us', target: 'about' },
        { name: 'Services', target: 'services' },
        { name: 'Portfolio', target: 'portfolio' },
        { name: 'Testimonials', target: 'testimonials' },
        { name: 'Contact', target: 'contact' },
    ];

    return (
        <nav className="fixed top-0 left-0 w-full bg-white shadow z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <a href="#hero" onClick={(e) => handleScroll(e, 'hero')}>
                            <Image src="/logo.png" alt="Epix Infra Logo" width={150} height={50} />
                        </a>
                    </div>
                    {/* Desktop Menu */}
                    <div className="hidden md:flex md:items-center">
                        {navLinks.map((link) => (
                            <motion.a
                                key={link.name}
                                href={`#${link.target}`}
                                onClick={(e) => handleScroll(e, link.target)}
                                whileHover={{ scale: 1.1 }} // Removed color change
                                className="ml-8 text-gray-700 hover:text-accent cursor-pointer transition-colors duration-300"
                            >
                                {link.name}
                            </motion.a>
                        ))}
                        <a
                            href="#contact"
                            onClick={(e) => handleScroll(e, 'contact')}
                            className="ml-8 px-4 py-2 bg-accent text-white rounded hover:bg-accent transition"
                        >
                            Get a Quote
                        </a>
                    </div>
                    {/* Mobile Menu Button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={toggleMenu}
                            aria-label="Toggle Menu"
                            className="text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600"
                        >
                            {isOpen ? (
                                <XMarkIcon className="h-6 w-6" />
                            ) : (
                                <Bars3Icon className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
            {/* Mobile Menu */}
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="md:hidden bg-white shadow-lg"
                >
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navLinks.map((link) => (
                            <motion.a
                                key={link.name}
                                href={`#${link.target}`}
                                onClick={(e) => {
                                    handleScroll(e, link.target);
                                    handleLinkClick();
                                }}
                                whileHover={{ scale: 1.05 }}
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 cursor-pointer transition-colors duration-300"
                            >
                                {link.name}
                            </motion.a>
                        ))}
                        <a
                            href="#contact"
                            onClick={(e) => {
                                handleScroll(e, 'contact');
                                handleLinkClick();
                            }}
                            className="block w-full text-left px-3 py-2 mt-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                        >
                            Get a Quote
                        </a>
                    </div>
                </motion.div>
            )}
        </nav>
    );
};

export default Navbar;
