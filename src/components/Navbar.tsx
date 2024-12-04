"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Use this for navigation
import { motion } from "framer-motion";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

gsap.registerPlugin(ScrollToPlugin);

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  const navigateToSection = (target: string) => {
    const currentPath = window.location.pathname;
    if (currentPath === "/") {
      // On the home page, scroll to the section
      const targetElement = document.getElementById(target);
      if (targetElement) {
        gsap.to(window, {
          duration: 0.5,
          scrollTo: {
            y: targetElement,
            offsetY: 80,
          },
          ease: "power2.out",
        });
      }
    } else {
      // On another page, navigate to home and scroll
      router.push(`/#${target}`);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  const navLinks = [
    { name: "Home", target: "hero" },
    { name: "About Us", target: "about" },
    { name: "Services", target: "services" },
    { name: "Portfolio", target: "portfolio", isExternal: true },
    { name: "Testimonials", target: "testimonials" },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-white shadow z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" onClick={() => navigateToSection("hero")}>
                <Image src="/logo.png" alt="Logo" width={150} height={50} />
              </Link>
            </div>
            <div className="hidden md:flex md:items-center">
              {navLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.isExternal ? "/projects" : `#${link.target}`}
                  onClick={(e) => {
                    if (link.isExternal) {
                      router.push("/projects");
                    } else {
                      e.preventDefault();
                      navigateToSection(link.target);
                    }
                  }}
                  whileHover={{ scale: 1.1 }}
                  className="ml-8 text-gray-700 hover:text-accent cursor-pointer transition-colors duration-300"
                >
                  {link.name}
                </motion.a>
              ))}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    onClick={() => setIsDialogOpen(true)}
                    className="ml-8 px-4 py-2 bg-accent text-white rounded hover:bg-accent transition"
                  >
                    Get a Quote
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto ">
                  <DialogHeader>
                    <DialogTitle>Get a Quote</DialogTitle>
                    <DialogClose className="btn-close" />
                  </DialogHeader>
                  <ContactForm onClose={() => setIsDialogOpen(false)} />
                </DialogContent>
                ̥
              </Dialog>
            </div>
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
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white shadow-lg"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.isExternal ? "/projects" : `#${link.target}`}
                  onClick={(e) => {
                    if (link.isExternal) {
                      router.push("/projects");
                    } else {
                      e.preventDefault();
                      navigateToSection(link.target);
                      handleLinkClick();
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 cursor-pointer transition-colors duration-300"
                >
                  {link.name}
                </motion.a>
              ))}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    onClick={() => {
                      setIsDialogOpen(true);
                      handleLinkClick();
                    }}
                    className="block w-full text-left px-3 py-2 mt-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Get a Quote
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Get a Quote</DialogTitle>
                    <DialogClose className="btn-close" />
                  </DialogHeader>
                  <ContactForm onClose={() => setIsDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
