"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import { Autoplay } from "swiper/modules";

const BrandLogos = () => {
    // Array of brand logo URLs (replace with your actual logo URLs)
    const brandLogos = [
        "/Logos/arcam.png",
        "/Logos/austin.png",
        "/Logos/Benq.png",
        "/Logos/bw.jpg",
        "/Logos/centuryply.png",
        "/Logos/Denon.png",
        "/Logos/dolby.png",
        "/Logos/ebco.png",
        "/Logos/emotiva_logo.webp",
        "/Logos/epson.png",
        "/Logos/focal.png",
        "/Logos/goldenear.png",
        "/Logos/greenply.png",
        "/Logos/hitachi.png",
        "/Logos/JBL.png",
        "/Logos/KEF.jpg",
        "/Logos/Klipsch.png",
        "/Logos/marantz.png",
        "/Logos/mk-some.png",
        "/Logos/monitoraudio.png",
        "/Logos/onkyo.png",
        "/Logos/pioneer.png",
        "/Logos/polk.png",
        "/Logos/Sony.png",
        "/Logos/sylvan.jpeg",
        "/Logos/wharfedale.png",
        "/Logos/Yamaha.png",
        "/Logos/caple.png",
    ];


    return (
        <div className="w-full py-1 mt-4">
            <div className="container mx-auto">
                <Swiper
                    modules={[Autoplay]}
                    slidesPerView={10} // Default number of logos visible
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
