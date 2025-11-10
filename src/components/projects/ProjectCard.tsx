"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Project } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import { Calendar, MapPin, Tag, ArrowRight } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  viewMode: "grid" | "list";
}

export default function ProjectCard({ project, viewMode }: ProjectCardProps) {
  const imageUrl = project.mainImage
    ? urlFor(project.mainImage).width(800).height(600).url()
    : "/placeholder-project.jpg";

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link
          href={`/projects/${project.slug.current}`}
          className="group flex flex-col md:flex-row gap-6 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
        >
          {/* Image */}
          <div className="relative w-full md:w-80 h-64 md:h-auto overflow-hidden bg-gray-100">
            <Image
              src={imageUrl}
              alt={project.mainImage?.alt || project.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {project.featured && (
              <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                ⭐ Featured
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Content */}
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              {/* Category Badge */}
              {project.category && (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold mb-3 uppercase tracking-wide">
                  <Tag className="h-3 w-3" />
                  {project.category.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                </div>
              )}

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                {project.title}
              </h3>

              {/* Description */}
              {project.description && (
                <p className="text-gray-600 leading-relaxed mb-4 line-clamp-2">
                  {project.description}
                </p>
              )}

              {/* Meta Information */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {project.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{project.location}</span>
                  </div>
                )}
                {project.completionDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(project.completionDate).getFullYear()}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {project.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* View Project Link */}
            <div className="flex items-center gap-2 text-blue-600 font-semibold mt-4 group-hover:gap-3 transition-all">
              View Project Details
              <ArrowRight className="h-5 w-5" />
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Grid View
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -8 }}
    >
      <Link
        href={`/projects/${project.slug.current}`}
        className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100"
      >
        {/* Image */}
        <div className="relative h-64 overflow-hidden bg-gray-100">
          <Image
            src={imageUrl}
            alt={project.mainImage?.alt || project.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {project.featured && (
            <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              ⭐ Featured
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Category Badge on Image */}
          {project.category && (
            <div className="absolute bottom-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-900 rounded-full text-xs font-semibold uppercase tracking-wide">
              {project.category.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">

            <div className={"flex items-center justify-between gap-1 mb-0"}>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-accent transition-colors line-clamp-1">
                    {project.title}
                </h3>

                <div className="flex items-center gap-2 text-accent font-semibold text-sm group-hover:gap-3 transition-all text-center -mt-4 ">
                    View Details
                    <ArrowRight className="h-4 w-4" />
                </div>

            </div>





          {/* Description */}
          {project.description && (
            <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
              {project.description}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
            {project.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{project.location}</span>
              </div>
            )}
            {project.completionDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(project.completionDate).getFullYear()}</span>
              </div>
            )}
          </div>

          {/* View Details Link */}

        </div>
      </Link>
    </motion.div>
  );
}
