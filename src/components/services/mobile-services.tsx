"use client";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { ServiceCard } from './service-card';
import { services } from './service-data';
import 'swiper/css';
import 'swiper/css/navigation';

export function MobileServices() {
    return (
        <div className="md:hidden relative">
            <Swiper
                modules={[Navigation, Autoplay]}
                spaceBetween={20}
                slidesPerView={1.2}
                centeredSlides={true}
                navigation={{
                    nextEl: '.custom-swiper-next',
                    prevEl: '.custom-swiper-prev',
                }}
                autoplay={{
                    delay: 3000,
                    disableOnInteraction: false,
                }}
                loop={true}
                className="services-swiper"
            >
                {services.map((service, index) => (
                    <SwiperSlide key={index}>
                        <ServiceCard service={service} index={index} />
                    </SwiperSlide>
                ))}
            </Swiper>
            <button className="custom-swiper-prev absolute top-1/2 -translate-y-1/2 left-4 z-10 bg-zinc-800/80 hover:bg-zinc-700/80 rounded-full p-3 transition-all">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="m15 18-6-6 6-6"/>
                </svg>
            </button>
            <button className="custom-swiper-next absolute top-1/2 -translate-y-1/2 right-4 z-10 bg-zinc-800/80 hover:bg-zinc-700/80 rounded-full p-3 transition-all">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="m9 18 6-6-6-6"/>
                </svg>
            </button>
        </div>
    );
}