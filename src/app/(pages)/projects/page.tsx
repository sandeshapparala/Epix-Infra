import { getAllProjects, getAllCategories } from "@/sanity/lib/queries";
import ProjectsContent from "@/components/projects/ProjectsContent";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function ProjectsPage() {
  const [projects, categories] = await Promise.all([
    getAllProjects(),
    getAllCategories(),
  ]);

  return (
    <main className="min-h-screen bg-gray-50">
      <ProjectsContent initialProjects={projects} categories={categories} />
    </main>
  );
}
