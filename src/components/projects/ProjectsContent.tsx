// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Grid3x3, List, X } from "lucide-react";
import ProjectCard from "@/components/projects/ProjectCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Props
 *  - initialProjects: Project[]
 *  - categories: string[]
 */
export default function ProjectsContent({ initialProjects, categories }) {
  const [rawQuery, setRawQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // debounced
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [sortBy, setSortBy] = useState("newest"); // future-ready

  // Debounce search input for better UX/perf
  useEffect(() => {
    const id = setTimeout(() => setSearchQuery(rawQuery.trim()), 250);
    return () => clearTimeout(id);
  }, [rawQuery]);

  const formatCategory = (cat) =>
    String(cat || "")
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  // category counts for chips
  const categoryCounts = useMemo(() => {
    const counts = initialProjects.reduce((acc, p) => {
      const c = p.category || "uncategorized";
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});
    return counts;
  }, [initialProjects]);

  // Filter + sort logic
  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase();

    let out = initialProjects.filter((project) => {
      const matchesSearch =
        !q ||
        (project.title || "").toLowerCase().includes(q) ||
        (project.description || "").toLowerCase().includes(q) ||
        (project.location || "").toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === "all" || project.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    if (sortBy === "newest") {
      out = out.sort((a, b) => (b.year || 0) - (a.year || 0));
    } else if (sortBy === "oldest") {
      out = out.sort((a, b) => (a.year || 0) - (b.year || 0));
    } // add more sorts as needed

    return out;
  }, [initialProjects, searchQuery, selectedCategory, sortBy]);

  const clearFilters = () => {
    setRawQuery("");
    setSearchQuery("");
    setSelectedCategory("all");
    setSortBy("newest");
  };

  return (
    <>
      {/* Top hero / header */}
      <header className="bg-gradient-to-r from-white/90 to-gray-50/90 border-b border-gray-200">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-24 py-6">
          <nav className="flex items-center text-sm text-gray-500 mb-4" aria-label="breadcrumb">
            <Link href="/" className="hover:text-gray-900">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Projects</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                Our Projects
              </h1>

            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-2xl sm:text-3xl font-semibold text-gray-900">
                  {filteredProjects.length}
                </div>
                <div className="text-xs text-gray-500">{filteredProjects.length === 1 ? "Project" : "Projects"}</div>
              </div>

              {/*<div className="hidden sm:flex sm:flex-col sm:items-end text-sm text-gray-600">*/}
              {/*  <div>Showing</div>*/}
              {/*  <div className="mt-1 text-gray-800 font-medium">{initialProjects.length} total</div>*/}
              {/*</div>*/}
            </div>
          </div>
        </div>
      </header>

      {/* Sticky filter bar */}
      <div className="sticky top-0 z-40 backdrop-blur-sm bg-white/70 border-b border-gray-200">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-24 py-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <label htmlFor="projects-search" className="sr-only">
                Search projects
              </label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                id="projects-search"
                value={rawQuery}
                onChange={(e) => setRawQuery(e.target.value)}
                placeholder="Search projects, location, or description..."
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow shadow-sm"
                aria-label="Search projects"
              />
              {rawQuery && (
                <button
                  onClick={() => {
                    setRawQuery("");
                    setSearchQuery("");
                  }}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>

            {/* Filters group */}
            <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 bg-white">
                <SlidersHorizontal className="h-4 w-4 text-gray-600" />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-44 text-sm border-0 p-0">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {formatCategory(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              {/* view toggle */}
              <div role="tablist" aria-label="View mode" className="flex items-center rounded-lg overflow-hidden border border-gray-100 bg-white">
                <button
                  onClick={() => setViewMode("grid")}
                  aria-pressed={viewMode === "grid"}
                  title="Grid view"
                  className={`p-2 transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
                >
                  <Grid3x3 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  aria-pressed={viewMode === "list"}
                  title="List view"
                  className={`p-2 transition-all ${viewMode === "list" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>

              <button
                onClick={clearFilters}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-transparent bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
                aria-label="Clear all filters"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Category chips (scrollable on small viewports) */}
          <div className="mt-3 overflow-x-auto no-scrollbar">
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  selectedCategory === "all"
                    ? "bg-gray-900 text-white shadow"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All ({initialProjects.length})
              </button>

              {categories.map((cat) => {
                const count = categoryCounts[cat] || 0;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      selectedCategory === cat
                        ? "bg-purple-600 text-white shadow"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    aria-pressed={selectedCategory === cat}
                  >
                    {formatCategory(cat)}{count ? ` (${count})` : ""}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-24 py-10">
        {filteredProjects.length === 0 ? (
          <section className="text-center py-24">
            <div className="mx-auto max-w-md">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                <Search className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No results</h3>
              <p className="text-gray-600 mb-6">
                No projects matched your search. Try adjusting filters, removing search terms or
                explore all projects.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={clearFilters}
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  Reset filters
                </button>
                <Link href="/contact" className="px-5 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition">
                  Request a project showcase
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section
            className={`${
              viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-6"
            }`}
            aria-live="polite"
          >
            {filteredProjects.map((project) => (
              <ProjectCard key={project._id} project={project} viewMode={viewMode} />
            ))}
          </section>
        )}
      </main>
    </>
  );
}
