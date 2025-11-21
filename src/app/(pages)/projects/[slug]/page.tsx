import { notFound } from "next/navigation";
import { getProjectBySlug, getAllProjects } from "@/sanity/lib/queries";
import ProjectDetail from "@/components/projects/ProjectDetail";

export const revalidate = 60;

// Generate static params for all projects
export async function generateStaticParams() {
  const projects = await getAllProjects();
  return projects.map((project) => ({
    slug: project.slug.current,
  }));
}

export default async function ProjectPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return <ProjectDetail project={project} />;
}
