// src/app/(admin)/admin/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { FeedbackSubmission, ContactSubmission, Project } from "@/types";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import EditFeedbackForm from "@/components/admin/EditFeedbackForm";
import EditContactForm from "@/components/admin/EditContactForm";
import AddProjectForm from "@/components/admin/AddProjectForm";
import EditProjectForm from "@/components/admin/EditProjectForm";
import { useAuth } from "@/context/AuthContext";

const AdminPage = () => {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("feedback");
  const [feedbackSubmissions, setFeedbackSubmissions] = useState<
    FeedbackSubmission[]
  >([]);
  const [contactSubmissions, setContactSubmissions] = useState<
    ContactSubmission[]
  >([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<
    FeedbackSubmission | ContactSubmission | Project | null
  >(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] =
    useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const feedbackCollection = collection(db, "feedback");
      const contactCollection = collection(db, "contact");
      const projectsCollection = collection(db, "projects");

      const feedbackUnsubscribe = onSnapshot(
        feedbackCollection,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const feedbacks: FeedbackSubmission[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as FeedbackSubmission[];
          setFeedbackSubmissions(feedbacks);
        },
        (error) => {
          console.error("Error fetching feedback submissions:", error);
        }
      );

      const contactUnsubscribe = onSnapshot(
        contactCollection,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const contacts: ContactSubmission[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as ContactSubmission[];
          setContactSubmissions(contacts);
        },
        (error) => {
          console.error("Error fetching contact submissions:", error);
        }
      );

      const projectsUnsubscribe = onSnapshot(
        projectsCollection,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const projectsData: Project[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Project[];
          setProjects(projectsData);
        },
        (error) => {
          console.error("Error fetching projects:", error);
        }
      );

      return () => {
        feedbackUnsubscribe();
        contactUnsubscribe();
        projectsUnsubscribe();
      };
    }
  }, [user]);

  const handleDelete = async (id: string, type: string) => {
    if (confirm(`Are you sure you want to delete this ${type} submission?`)) {
      try {
        await deleteDoc(doc(db, type, id));
        console.log(`Deleted ${type} submission with ID: ${id}`);
      } catch (error) {
        console.error(`Error deleting ${type} submission:`, error);
      }
    }
  };

  const handleEdit = (
    submission: FeedbackSubmission | ContactSubmission | Project,
    type: string
  ) => {
    console.log(`Editing ${type} submission:`, submission);
    setSelectedSubmission(submission);
    setEditMode(true);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (
    updatedSubmission: FeedbackSubmission | ContactSubmission | Project,
    type: string
  ) => {
    try {
      const submissionDoc = doc(db, type, updatedSubmission.id);
      await updateDoc(submissionDoc, {
        ...updatedSubmission,
        updatedAt: new Date(),
      });
      console.log(
        `Updated ${type} submission with ID: ${updatedSubmission.id}`
      );
      setSelectedSubmission(null);
      setEditMode(false);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error(`Error updating ${type} submission:`, error);
    }
  };

  const handleAddProject = async (newProject: Project) => {
    setProjects([...projects, newProject]);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <button
          onClick={signOut}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Logout
        </button>
      </header>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-4 border-b">
          <button
            onClick={() => setActiveTab("feedback")}
            className={`py-2 px-4 ${
              activeTab === "feedback"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            Feedback Submissions
          </button>
          <button
            onClick={() => setActiveTab("contact")}
            className={`py-2 px-4 ${
              activeTab === "contact"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            Contact Submissions
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`py-2 px-4 ${
              activeTab === "projects"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            Projects
          </button>
        </nav>
      </div>

      {/* Submissions */}
      {activeTab === "feedback" && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Feedback Form Submissions
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-200">
                <tr>
                  <th className="py-2 px-4 border-b">Name</th>
                  <th className="py-2 px-4 border-b">Company</th>
                  <th className="py-2 px-4 border-b">Email</th>
                  <th className="py-2 px-4 border-b">Rating</th>
                  <th className="py-2 px-4 border-b">Feedback</th>
                  <th className="py-2 px-4 border-b">Submitted At</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {feedbackSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-gray-500">
                      No feedback submissions found.
                    </td>
                  </tr>
                ) : (
                  feedbackSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-100">
                      <td className="py-2 px-4 border-b">{submission.name}</td>
                      <td className="py-2 px-4 border-b">
                        {submission.company || "N/A"}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {submission.email || "N/A"}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {submission.rating ?? "N/A"}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {submission.feedback}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {submission.createdAt?.toDate().toLocaleString()}
                      </td>
                      <td className="py-2 px-4 border-b">
                        <button
                          onClick={() => handleEdit(submission, "feedback")}
                          className="px-2 py-1 bg-yellow-500 text-white rounded mr-2 hover:bg-yellow-600 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(submission.id, "feedback")
                          }
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "contact" && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Contact Form Submissions
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-200">
                <tr>
                  <th className="py-2 px-4 border-b">Name</th>
                  <th className="py-2 px-4 border-b">Email</th>
                  <th className="py-2 px-4 border-b">Subject</th>
                  <th className="py-2 px-4 border-b">Message</th>
                  <th className="py-2 px-4 border-b">Submitted At</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contactSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-gray-500">
                      No contact submissions found.
                    </td>
                  </tr>
                ) : (
                  contactSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-100">
                      <td className="py-2 px-4 border-b">{submission.name}</td>
                      <td className="py-2 px-4 border-b">{submission.email}</td>
                      <td className="py-2 px-4 border-b">
                        {submission.subject}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {submission.message}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {submission.createdAt?.toDate().toLocaleString()}
                      </td>
                      <td className="py-2 px-4 border-b">
                        <button
                          onClick={() => handleEdit(submission, "contact")}
                          className="px-2 py-1 bg-yellow-500 text-white rounded mr-2 hover:bg-yellow-600 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(submission.id, "contact")}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "projects" && (
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Projects</h2>
            <Dialog
              open={isAddProjectDialogOpen}
              onOpenChange={setIsAddProjectDialogOpen}
            >
              <DialogTrigger asChild>
                <button
                  onClick={() => setIsAddProjectDialogOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Add New Project
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Project</DialogTitle>
                  <DialogClose className="btn-close" />
                </DialogHeader>
                <AddProjectForm
                  onClose={() => setIsAddProjectDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-200">
                <tr>
                  <th className="py-2 px-4 border-b">Name</th>
                  <th className="py-2 px-4 border-b">Category</th>
                  <th className="py-2 px-4 border-b">Image</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">
                      No projects found.
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-100">
                      <td className="py-2 px-4 border-b">{project.name}</td>
                      <td className="py-2 px-4 border-b">{project.category}</td>
                      <td className="py-2 px-4 border-b">
                        <img
                          src={project.imageUrl}
                          alt={project.name}
                          className="h-16 w-16 object-cover rounded"
                        />
                      </td>
                      <td className="py-2 px-4 border-b">
                        <button
                          onClick={() => handleEdit(project, "projects")}
                          className="px-2 py-1 bg-yellow-500 text-white rounded mr-2 hover:bg-yellow-600 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(project.id, "projects")}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Edit Submission Dialog */}
      {selectedSubmission && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <button className="hidden">Open</button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Edit{" "}
                {activeTab === "feedback"
                  ? "Feedback"
                  : activeTab === "contact"
                  ? "Contact"
                  : "Project"}{" "}
                Submission
              </DialogTitle>
              <DialogClose className="btn-close" />
            </DialogHeader>
            {activeTab === "feedback" && (
              <EditFeedbackForm
                feedback={selectedSubmission as FeedbackSubmission}
                onUpdate={(updated) => handleUpdate(updated, "feedback")}
                onClose={() => setSelectedSubmission(null)}
              />
            )}
            {activeTab === "contact" && (
              <EditContactForm
                contact={selectedSubmission as ContactSubmission}
                onUpdate={(updated) => handleUpdate(updated, "contact")}
                onClose={() => setSelectedSubmission(null)}
              />
            )}
            {activeTab === "projects" && (
              <EditProjectForm
                project={selectedSubmission as Project}
                onUpdate={(updated) => handleUpdate(updated, "projects")}
                onClose={() => setSelectedSubmission(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminPage;
