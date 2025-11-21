"use client";

import { useEffect, useState } from "react";
import { Project, getFeaturedProjects, getAllProjects } from "@/sanity/lib/queries";
import ProjectCard from "@/components/projects/ProjectCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomeProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        // Try to get featured projects first
        let data = await getFeaturedProjects();
        
        // If no featured projects, fallback to recent projects
        if (data.length === 0) {
          const all = await getAllProjects();
          data = all.slice(0, 4); // Limit to 4 projects total
        } else {
            // If we have featured projects, still limit to 4 for the home page
            data = data.slice(0, 4);
        }
        
        setProjects(data);
      } catch (error) {
        console.error("Failed to fetch projects", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  if (loading) {
    return null; // Or a skeleton loader
  }

  if (projects.length === 0) return null;

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto lg:px-20 px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Projects
            </h2>
            <p className="text-gray-600 max-w-2xl">
              Explore our latest work in home theater, interior design, and automation.
            </p>
          </div>
          <Link 
            href="/projects" 
            className="hidden md:flex items-center gap-2 text-blue-600 font-semibold hover:gap-3 transition-all"
          >
            View All Projects <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} viewMode="grid" />
          ))}
        </div>

        <div className="mt-10 text-center md:hidden">
          <Link 
            href="/projects" 
            className="inline-flex items-center gap-2 text-blue-600 font-semibold"
          >
            View All Projects <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
