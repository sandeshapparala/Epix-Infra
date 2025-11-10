// components/sections/Hero2.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import {useState} from 'react';
import {ArrowRight, ChevronLeft, ChevronRight} from 'lucide-react';

// Example images (replace with your own as needed)
import mainImg from '@/Images/interior2.jpg';
import project1 from '@/Images/interior3.jpg';
import project2 from '@/Images/luxary.jpg';

const stats = [
    {label: 'projects', value: '100+'},
    {label: 'years of work', value: '8'},
    {label: 'employees', value: '12'},
    {label: 'square meters', value: '50K+'},
];

const projects = [
    {
        image: project1,
        label: 'Turnkey repair',
    },
    {
        image: project2,
        label: 'View the project',
    },
];

export default function Hero2() {
    const [currentProject, setCurrentProject] = useState(0);

    const nextProject = () => setCurrentProject((i) => (i + 1) % projects.length);
    const prevProject = () => setCurrentProject((i) => (i - 1 + projects.length) % projects.length);

    return (
        <section
            className="relative bg-gray-50  overflow-hidden p-4 md:p-8 lg:py-6  h-screen container mx-auto lg:px-8 ">
            <div className="flex flex-col lg:flex-row gap-8 items-center justify-between  mx-auto h-full relative">
                {/* Left: Main Image & Stats */}
                <div className="relative flex-1 min-w-[350px] flex flex-col justify-between h-full">
                    <div className="relative rounded-3xl overflow-hidden aspect-[1.3/1] bg-white shadow-lg h-full">
                        <Image
                            src={mainImg}
                            alt="Modern Interior"
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className={"pb-4"}>
                            {/* Floating Card */}
                            <div
                                className="absolute top-6 left-6 bg-white rounded-xl shadow-lg p-2 w-32 flex flex-col items-center">
                                <div className="w-full h-20 relative rounded-lg overflow-hidden mb-2">
                                    <Image src={project1} alt="Company projects" fill className="object-cover"/>
                                </div>
                                <span className="text-xs text-gray-500">Company projects</span>
                            </div>
                            {/* Social Icons */}
                            {/*<div className="absolute top-8 right-8 flex flex-col gap-3">*/}
                            {/*  <button className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition"><span className="sr-only">Instagram</span><svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" stroke="#aaa" strokeWidth="2"/><rect x="2" y="2" width="20" height="20" rx="6" stroke="#aaa" strokeWidth="2"/><circle cx="18" cy="6" r="1" fill="#aaa"/></svg></button>*/}
                            {/*  <button className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition"><span className="sr-only">Telegram</span><svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M3 12L21 3L14 21L11 13L3 12Z" stroke="#aaa" strokeWidth="2"/></svg></button>*/}
                            {/*  <button className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition"><span className="sr-only">YouTube</span><svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="4" stroke="#aaa" strokeWidth="2"/><path d="M10 9L15 12L10 15V9Z" fill="#aaa"/></svg></button>*/}
                            {/*</div>*/}
                            {/* Stats */}
                            <div
                                className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-4 bg-white/80 rounded-2xl px-6 py-3 shadow-lg backdrop-blur-md">
                                {stats.map((stat) => (
                                    <div key={stat.label} className="flex flex-col items-center min-w-[60px]">
                                        <span className="font-bold text-lg text-gray-800">{stat.value}</span>
                                        <span className="text-xs text-gray-500 whitespace-nowrap">{stat.label}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Quote */}
                            <div className="absolute bottom-6 left-0 w-full flex justify-center pb-2">
                                <div className="bg-white/90 rounded-xl px-6 py-2 text-[13px] text-gray-600 shadow">We don’t
                                    design for design’s sake and always prioritize the needs of the people interacting
                                    with the space
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Right: Content */}
                <div className="flex-1 flex flex-col justify-between gap-8 h-full pt-6 items-center">
                    {/* Nav */}
                    <nav className="flex justify-center gap-6 mb-4 pl-6 bg-gray-200/50 rounded-full items-center">
                        {['Home', 'About Us', 'Services', 'Portfolio', 'Contact'].map((item) => (
                            <Link key={item} href="#"
                                  className="text-gray-700 font-medium hover:text-gray-900 transition text-base px-3 py-1 rounded-lg">
                                {item}
                            </Link>
                        ))}
                        <button className="ml-4 p-2 rounded-lg hover:bg-gray-100 transition">
                            <span className="sr-only">Menu</span>
                            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                                <rect x="4" y="7" width="16" height="2" rx="1" fill="#aaa"/>
                                <rect x="4" y="15" width="16" height="2" rx="1" fill="#aaa"/>
                            </svg>
                        </button>
                    </nav>
                    {/* Headline */}
                    <div className="mb-6 flex flex-col items-center">
                        <div>
                            <p className={"text-[8px]"}>We accompany the project during repair</p>
                        </div>
                        <h1 className="text-4xl md:text-7xl font-bold text-gray-900 leading-tight mb-2">Modern
                            Interiors</h1>
                        <h1 className="text-4xl md:text-7xl font-bold text-gray-900 leading-tight mb-2">With Soul</h1>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs text-gray-500">Elegant design, impressive architecture, mastery of renovation</span>
                            <span className="inline-block w-8 h-2 bg-gray-200 rounded-full"/>
                        </div>
                    </div>
                    {/* CTAs */}
                    <div className="flex gap-4 mb-8">
                        <button
                            className="bg-[#e3dbcf] text-gray-900 font-semibold px-8 py-4 rounded-full text-lg hover:bg-[#d6cfc3] transition">Calculate
                            the cost
                        </button>
                        <button
                            className="bg-white border border-gray-300 text-gray-900 font-semibold px-8 py-4 rounded-full text-lg hover:bg-gray-50 transition">Get
                            a consultation
                        </button>
                    </div>
                    {/* Customer rating */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="bg-white rounded-2xl shadow-lg px-6 py-4 flex flex-col items-start">
                            <span className="text-gray-700 text-sm mb-1">Only satisfied customers</span>
                            <span className="flex items-center text-lg font-bold text-gray-900">5.0 <span
                                className="ml-1 text-yellow-400">★★★★★</span></span>
                            <div className="flex mt-2 -space-x-2">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"/>
                                ))}
                            </div>
                        </div>
                        {/* Project cards carousel */}
                        <div className="flex gap-4 items-center">
                            <button onClick={prevProject}
                                    className="w-8 h-8 rounded-full bg-white border shadow flex items-center justify-center hover:bg-gray-100 transition">
                                <ChevronLeft size={18}/></button>
                            <div className="relative w-32 h-24 rounded-2xl overflow-hidden shadow-lg">
                                <Image src={projects[currentProject].image} alt={projects[currentProject].label} fill
                                       className="object-cover"/>
                                <span
                                    className="absolute top-2 left-2 bg-white/80 text-xs px-2 py-1 rounded-lg font-medium">{projects[currentProject].label}</span>
                                <button className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow">
                                    <ArrowRight size={16}/></button>
                            </div>
                            <button onClick={nextProject}
                                    className="w-8 h-8 rounded-full bg-white border shadow flex items-center justify-center hover:bg-gray-100 transition">
                                <ChevronRight size={18}/></button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
