"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getAllProjects, Project } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";

export default function ProjectsGrid() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const data = await getAllProjects();
        setProjects(data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-300 h-64 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {projects.map((project) => (
        <Link
          href={`/projects/${project.slug.current}`}
          key={project._id}
          className="group block"
        >
          <div className="relative h-64 mb-4 overflow-hidden rounded-lg">
            {project.mainImage && (
              <Image
                src={urlFor(project.mainImage).width(600).height(400).url()}
                alt={project.mainImage.alt || project.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
            )}
            {project.featured && (
              <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Featured
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {project.title}
              </h3>
              {project.category && (
                <span className="text-xs uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {project.category}
                </span>
              )}
            </div>
            {project.description && (
              <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
            )}
            {project.location && (
              <p className="text-xs text-gray-500">📍 {project.location}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
