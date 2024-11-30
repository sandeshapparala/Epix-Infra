"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import { Autoplay } from "swiper/modules";

const BrandLogos = () => {
    // Array of brand logo URLs (replace with your actual logo URLs)
    const brandLogos = [
        "/Logos/Benq.png",
        "/Logos/Denon.png",
        "/Logos/JBL.png",
        "/Logos/Klipsch.png",
        "/Logos/Samsung.png",
        "/Logos/Sony.png",
        "/Logos/Yamaha.png",
    ];

    return (
        <div className="w-full py-1 mt-4">
            <div className="container mx-auto">
                <Swiper
                    modules={[Autoplay]}
                    slidesPerView={5} // Default number of logos visible
                    spaceBetween={20}
                    breakpoints={{
                        640: { slidesPerView: 3 }, // For small devices
                        768: { slidesPerView: 4 }, // For tablets
                        1024: { slidesPerView: 6 }, // For desktops
                    }}
                    autoplay={{
                        delay: 1000,
                        disableOnInteraction: false,
                    }}
                    loop={true}
                    className="w-full"
                >
                    {brandLogos.map((logo, index) => (
                        <SwiperSlide key={index} className="flex justify-center items-center">
                            <div className="flex items-center justify-center w-full h-24 ">
                                <img
                                    src={logo}
                                    alt={`Brand ${index + 1}`}
                                    className="h-full object-contain logo-img"
                                />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
};

export default BrandLogos;
