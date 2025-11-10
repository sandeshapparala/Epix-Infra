import { client } from '../lib/client'

// Define TypeScript interfaces for your data
export interface Project {
  _id: string
  _createdAt: string
  title: string
  slug: {
    current: string
  }
  category: string
  mainImage: {
    asset: {
      _ref: string
      _type: string
    }
    alt?: string
  }
  gallery?: Array<{
    asset: {
      _ref: string
      _type: string
    }
    alt?: string
    caption?: string
  }>
  video?: {
    _type: string
    url: string
  }
  description?: string
  content?: unknown[]
  location?: string
  client?: string
  completionDate?: string
  projectDuration?: string
  budget?: string
  featured?: boolean
  tags?: string[]
  publishedAt: string
}

// Fetch all projects
export async function getAllProjects(): Promise<Project[]> {
  const query = `*[_type == "project"] | order(publishedAt desc) {
    _id,
    _createdAt,
    title,
    slug,
    category,
    mainImage,
    description,
    location,
    completionDate,
    featured,
    tags,
    publishedAt
  }`
  
  return client.fetch(query)
}

// Fetch featured projects
export async function getFeaturedProjects(): Promise<Project[]> {
  const query = `*[_type == "project" && featured == true] | order(publishedAt desc) {
    _id,
    _createdAt,
    title,
    slug,
    category,
    mainImage,
    description,
    location,
    completionDate,
    featured,
    tags,
    publishedAt
  }`
  
  return client.fetch(query)
}

// Fetch projects by category
export async function getProjectsByCategory(category: string): Promise<Project[]> {
  const query = `*[_type == "project" && category == $category] | order(publishedAt desc) {
    _id,
    _createdAt,
    title,
    slug,
    category,
    mainImage,
    description,
    location,
    completionDate,
    featured,
    tags,
    publishedAt
  }`
  
  return client.fetch(query, { category })
}

// Fetch a single project by slug
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const query = `*[_type == "project" && slug.current == $slug][0] {
    _id,
    _createdAt,
    title,
    slug,
    category,
    mainImage,
    gallery,
    "video": video.asset->,
    description,
    content,
    location,
    client,
    completionDate,
    projectDuration,
    budget,
    featured,
    tags,
    publishedAt
  }`
  
  return client.fetch(query, { slug })
}

// Fetch all project categories
export async function getAllCategories(): Promise<string[]> {
  const query = `*[_type == "project"] | order(category asc) {
    "category": category
  }`
  
  const projects = await client.fetch(query)
  const categories = [...new Set(projects.map((p: { category: string }) => p.category))].filter(Boolean)
  return categories as string[]
}
