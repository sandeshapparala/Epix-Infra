'use client'

import { useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
// import { ImageGrid } from './ui/image-grid'
import { Facebook, Twitter, Instagram, ArrowRight, Send } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const socialLinks = [
    { icon: Facebook, href: 'https://sandeshapparala.com/' },
    { icon: Twitter, href: 'https://x.com/sandeshapparala' },
    { icon: Instagram, href: 'https://www.instagram.com/epixinfra/' },
    // { icon: Linkedin, href: '#' },
]

const services = [
    'Home Theatre Installation',
    'Interior Design',
    'Construction Services',
    'Electrical & Lighting',
    'Smart Integration',
]

export default function Footer() {
    const footerRef = useRef<HTMLElement>(null)
    const { scrollYProgress } = useScroll()
    const opacity = useTransform(scrollYProgress, [0.7, 1], [0, 1])

    useEffect(() => {
        if (!footerRef.current) return

        const sections = footerRef.current.querySelectorAll('section')

        sections.forEach((section, index) => {
            gsap.from(section, {
                scrollTrigger: {
                    trigger: section,
                    start: 'top bottom',
                    toggleActions: 'play none none reverse',
                },
                opacity: 0,
                y: 50,
                duration: 1,
                delay: index * 0.2,
            })
        })
    }, [])

    return (
        <footer ref={footerRef} className="relative bg-black text-white overflow-hidden">

            <div className="container mx-auto px-4 py-16 relative z-10  lg:px-20 ">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {/* Brand Section */}
                    <section className="space-y-6">
                        <motion.h2
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            className="text-3xl font-bold text-[#C8B496]"
                        >
                            Epix Infra
                        </motion.h2>
                        <p className="text-gray-400">
                            At Epix Infra, we redefine living spaces by blending innovation with expertise to deliver immersive experiences that exceed expectations.
                        </p>
                        <div className="flex space-x-4">
                            {socialLinks.map(({ icon: Icon, href }, index) => (
                                <motion.a
                                    key={index}
                                    href={href}
                                    whileHover={{ scale: 1.2, rotate: 10 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="text-[#C8B496] hover:text-white transition-colors"
                                >
                                    <Icon size={24} />
                                </motion.a>
                            ))}
                        </div>
                        <address className="text-gray-400">
                            18th cross road, <br/>
                            Balaji Nagar, Nellore, <br/>
                            Andhra Pradesh, India
                            <br />
                            +91 1234567890

                        </address>

                    </section>

                    {/*/!* Latest Work Section *!/*/}
                    {/*<section className="space-y-6">*/}
                    {/*    <h2 className="text-2xl font-bold text-[#C8B496]">LATEST WORK</h2>*/}
                    {/*    /!*<ImageGrid />*!/*/}
                    {/*</section>*/}

                    {/* Services Section */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold text-[#C8B496]">SERVICES</h2>
                        <ul className="space-y-3">
                            {services.map((service, index) => (
                                <motion.li
                                    key={index}
                                    whileHover={{ x: 10 }}
                                    className="flex items-center group cursor-pointer"
                                >
                                    <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity text-[#C8B496]" />
                                    <span className="text-gray-400 group-hover:text-white transition-colors">
                    {service}
                  </span>
                                </motion.li>
                            ))}
                        </ul>
                    </section>

                    {/* Newsletter Section */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold text-[#C8B496]">Reach to us</h2>
                        <p className="text-gray-400">
                            It is important to take care of the patient, and the result will be adipisicing.
                        </p>
                        <div className="relative">
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                            />
                            <Button
                                size="icon"
                                className="absolute right-1 top-1 bg-[#C8B496] hover:bg-[#B8A486]"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </section>
                </div>

                {/* Copyright Section */}
                <motion.div
                    style={{ opacity }}
                    className="mt-16 pt-8 border-t border-white/10 text-center text-gray-400"
                >
                    <p>Epix Infra © {new Date().getFullYear()} All Right Reserved</p>
                </motion.div>
            </div>
        </footer>
    )
}

