// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable */


// components/projects/ProjectDetail.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Project } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import {
  Calendar,
  MapPin,
  User,
  Clock,
  DollarSign,
  ArrowLeft,
  Tag,
  Share2,
  RotateCcw,
  Download,
  X,
} from "lucide-react";
import { PortableText } from "@portabletext/react";

interface ProjectDetailProps {
  project: Project;
}

export default function ProjectDetail({ project }: ProjectDetailProps) {
  const mainImageUrl = project.mainImage
    ? urlFor(project.mainImage).width(2000).height(1200).url()
    : "/placeholder-project.jpg";

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const gallery = project.gallery || [];

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const nextImg = () =>
    setLightboxIndex((i) => (i === null ? 0 : (i + 1) % gallery.length));
  const prevImg = () =>
    setLightboxIndex((i) => (i === null ? 0 : (i - 1 + gallery.length) % gallery.length));

  const fmt = (s?: string) =>
    (s || "")
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  return (
    <div className="min-h-screen bg-neutral-50 antialiased text-gray-900">
      {/* Top bar with breadcrumb */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition"
              aria-label="Back to projects"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Projects</span>
            </Link>

            <span className="text-sm text-gray-400">/</span>

            <span className="text-sm font-medium text-gray-800">{project.title}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-white border border-gray-100 shadow-sm text-sm hover:shadow-md transition"
              aria-label="Share project"
            >
              <Share2 className="h-4 w-4 text-gray-600" />
              Share
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-white border border-gray-100 shadow-sm text-sm hover:shadow-md transition"
              onClick={() => window.print()}
              aria-label="Print project"
            >
              <RotateCcw className="h-4 w-4 text-gray-600" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* HERO */}

<header className="relative">
  <div className="relative z-0"> {/* hero base z-0 so overlays and content sit below floating panel */}
    <div className="relative h-[56vh] min-h-[420px] bg-black z-0">
      <Image
        src={mainImageUrl}
        alt={project.mainImage?.alt || project.title}
        fill
        className="object-cover z-0"
        priority
      />

      {/* soft overlay for readable text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent z-10" />

      <div className="absolute inset-0 flex items-end z-20">
        <div className="max-w-6xl w-full mx-auto px-6 pb-14">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/6 backdrop-blur-md rounded-2xl p-6 md:p-8 max-w-3xl"
            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
          >
            {/* metadata badge */}
            <div className="flex items-center gap-3 mb-3">
              {project.category && (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold tracking-wide">
                  <Tag className="w-4 h-4" />
                  {fmt(project.category)}
                </span>
              )}
              {project.featured && (
                <span className="text-xs bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                  Featured
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight text-white">
              {project.title}
            </h1>
            {project.description && (
              <p className="mt-3 text-sm md:text-base text-white/80 max-w-2xl">
                {project.description}
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  </div>

  {/* Floating info bar (moved above hero with higher z-index) */}
  <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-30"> 
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-5 flex flex-col md:flex-row gap-4 md:gap-8 items-center justify-between">
      <div className="flex items-center gap-6">
        {/* client/avatar */}
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-white flex items-center justify-center border border-gray-100 shadow-sm">
          <User className="w-7 h-7 text-gray-600" />
        </div>

        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Project</div>
          <div className="text-sm md:text-base font-medium text-gray-900">{project.title}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        {project.location && (
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-blue-600" />
            <div className="text-sm">
              <div className="text-xs text-gray-400 uppercase">Location</div>
              <div className="font-medium text-gray-800">{project.location}</div>
            </div>
          </div>
        )}

        {project.completionDate && (
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div className="text-sm">
              <div className="text-xs text-gray-400 uppercase">Completed</div>
              <div className="font-medium text-gray-800">
                {new Date(project.completionDate).toLocaleString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
        )}

        {project.projectDuration && (
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <div className="text-sm">
              <div className="text-xs text-gray-400 uppercase">Duration</div>
              <div className="font-medium text-gray-800">{project.projectDuration}</div>
            </div>
          </div>
        )}

        {project.budget && (
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <div className="text-sm">
              <div className="text-xs text-gray-400 uppercase">Budget</div>
              <div className="font-medium text-gray-800">{project.budget}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
</header>


      {/* Main content area */}
      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Rich content + gallery */}
        <div className="lg:col-span-2 space-y-10">
          {/* Overview card */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
            {project.shortText ? (
              <p className="text-gray-700 text-base leading-relaxed">{project.shortText}</p>
            ) : project.content ? (
              <div className="prose prose-lg max-w-none text-gray-700">
                <PortableText value={project.content as any} />
              </div>
            ) : (
              <p className="text-gray-600">No overview provided for this project.</p>
            )}
          </section>

          {/* Gallery */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Gallery</h3>

            {gallery.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-white/50 p-10 text-center text-gray-500">
                No gallery images available.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gallery.map((img, idx) => {
                  const src = urlFor(img).width(1400).height(900).url();
                  return (
                    <button
                      key={idx}
                      onClick={() => openLightbox(idx)}
                      className="group block rounded-xl overflow-hidden shadow-sm transform hover:scale-[1.01] transition"
                      aria-label={`Open image ${idx + 1}`}
                    >
                      <div className="relative aspect-[16/10] w-full bg-gray-100">
                        <Image
                          src={src}
                          alt={img.alt || `Project image ${idx + 1}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-400"
                        />
                      </div>
                      {img.caption && (
                        <div className="mt-3 text-sm text-gray-500 px-1">{img.caption}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Video Section */}
          {project.video && (
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Project Video</h3>
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-gray-100">
                <video
                  controls
                  className="absolute inset-0 w-full h-full object-cover"
                  src={project.video.asset?.url}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </section>
          )}
        </div>

        {/* Right: sticky contact / CTA / tags */}
        <aside className="lg:col-span-1">
          <div className="sticky top-28 space-y-6">
            {/* Contact / Inquiry panel */}
            <div className="rounded-2xl bg-gradient-to-br from-white to-white/95 border border-gray-100 p-6 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900">Start a project</h4>
              <p className="mt-2 text-sm text-gray-600">
                Interested in a similar design? Tell us about your brief and timeline — we'll follow up.
              </p>

              <Link
                href="/contact"
                className="mt-4 inline-flex items-center justify-center w-full rounded-lg bg-gray-900 text-white py-3 font-semibold hover:bg-black transition"
              >
                Get a Quote
              </Link>

              <div className="mt-4 flex gap-3">
                <a
                  href={`mailto:hello@yourstudio.com?subject=Project inquiry - ${encodeURIComponent(
                    project.title || "Project"
                  )}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-100 w-full justify-center text-sm"
                >
                  Email
                </a>
                <a
                  href={`/projects/${project.slug?.current}/download`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-100 w-full justify-center text-sm"
                >
                  <Download className="w-4 h-4" />
                  Brochure
                </a>
              </div>
            </div>

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="text-sm text-gray-500 mb-3">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((t, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick facts */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-sm text-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-gray-400">Project Type</div>
                <div className="font-medium">{fmt(project.category || "—")}</div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-gray-400">Client</div>
                <div className="font-medium">{project.client || "—"}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">Timeline</div>
                <div className="font-medium">{project.projectDuration || "—"}</div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Lightbox overlay */}
      <AnimatePresence>
        {lightboxIndex !== null && gallery[lightboxIndex] && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
            aria-modal="true"
            role="dialog"
          >
            <motion.div
              className="relative max-w-[1200px] w-full max-h-[90vh] rounded-xl overflow-hidden"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeLightbox}
                className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 hover:bg-white text-gray-800 shadow"
                aria-label="Close image"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative w-full aspect-[16/10] bg-black">
                <Image
                  src={urlFor(gallery[lightboxIndex]).width(2000).height(1400).url()}
                  alt={gallery[lightboxIndex]?.alt || `Image ${lightboxIndex + 1}`}
                  fill
                  className="object-contain"
                />
              </div>

              {/* controls */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-6">
                <button
                  onClick={prevImg}
                  className="pointer-events-auto rounded-full bg-white/90 p-2 hover:bg-white shadow"
                  aria-label="Previous image"
                >
                  ◀
                </button>
                <button
                  onClick={nextImg}
                  className="pointer-events-auto rounded-full bg-white/90 p-2 hover:bg-white shadow"
                  aria-label="Next image"
                >
                  ▶
                </button>
              </div>

              {/* caption + download */}
              <div className="flex items-center justify-between gap-4 p-4 bg-white/95">
                <div className="text-sm text-gray-700">
                  {gallery[lightboxIndex]?.caption || gallery[lightboxIndex]?.alt || ""}
                </div>
                <a
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 bg-gray-900 text-white"
                  href={urlFor(gallery[lightboxIndex]).width(3000).height(2000).url()}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
