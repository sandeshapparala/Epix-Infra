"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import Image from "next/image";

import "swiper/css";
import "swiper/css/effect-fade";

interface ImageSliderProps {
    images: string[];
    title: string;
}

export function ImageSlider({ images, title }: ImageSliderProps) {
    return (
        <div className="relative">
            <Swiper
                modules={[Autoplay, EffectFade]}
                effect="fade"
                speed={800}
                autoplay={{
                    delay: 4000,
                    disableOnInteraction: false,
                }}
                loop={true}
                className="h-[300px] w-full"
            >
                {images.map((image, index) => (
                    <SwiperSlide key={index}>
                        <div className="relative h-full w-full">
                            <Image
                                src={image}
                                alt={`${title} - Slide ${index + 1}`}
                                fill
                                className="object-cover"
                                priority={index === 0}
                            />
                            <div className="absolute inset-0 bg-black/40 transition-opacity group-hover:opacity-0" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 pb-3 text-white bg-gradient-to-t from-black/80 to-transparent">
                                <h3 className="text-2xl font-bold text-center">{title}</h3>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}