// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
/* eslint-disable */

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
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  LogOut,
  Loader2,
  PlusCircle,
  Pencil,
  Trash2,
  MessageSquare,
  Mail,
  FolderKanban,
} from "lucide-react";
import EditFeedbackForm from "@/components/admin/EditFeedbackForm";
import EditContactForm from "@/components/admin/EditContactForm";
import AddProjectForm from "@/components/admin/AddProjectForm";
import EditProjectForm from "@/components/admin/EditProjectForm";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";

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
  const [, setEditMode] = useState<boolean>(false);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] =
    useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [deleteInfo, setDeleteInfo] = useState<{
    id: string;
    type: string;
  } | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState<boolean>(false);

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
          toast.error("Failed to fetch feedback submissions");
        },
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
          toast.error("Failed to fetch contact submissions");
        },
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
          toast.error("Failed to fetch projects");
        },
      );

      return () => {
        feedbackUnsubscribe();
        contactUnsubscribe();
        projectsUnsubscribe();
      };
    }
  }, [user]);

  const handleDelete = async (id: string, type: string) => {
    try {
      setIsDeleting(id);
      await deleteDoc(doc(db, type, id));
      toast.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`,
      );
    } catch (error) {
      console.error(`Error deleting ${type} submission:`, error);
      toast.error(`Failed to delete ${type}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEdit = (
    submission: FeedbackSubmission | ContactSubmission | Project,
  ) => {
    setSelectedSubmission(submission);
    setEditMode(true);
    setIsEditDialogOpen(true);
  };

  const handleView = (
    submission: FeedbackSubmission | ContactSubmission | Project,
  ) => {
    setSelectedSubmission(submission);
    setIsViewDialogOpen(true);
  };

  const handleUpdate = async (
    updatedSubmission: FeedbackSubmission | ContactSubmission | Project,
    type: string,
  ) => {
    try {
      const submissionDoc = doc(db, type, updatedSubmission.id);
      await updateDoc(submissionDoc, {
        ...updatedSubmission,
        updatedAt: new Date(),
      });
      toast.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`,
      );
      setSelectedSubmission(null);
      setEditMode(false);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error(`Error updating ${type} submission:`, error);
      toast.error(`Failed to update ${type}`);
    }
  };

  const confirmDelete = (id: string, type: string) => {
    setDeleteInfo({ id, type });
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteInfo) {
      await handleDelete(deleteInfo.id, deleteInfo.type);
      setIsDeleteDialogOpen(false);
      setDeleteInfo(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <span className="text-sm text-gray-400 tracking-wide">
            Loading workspace…
          </span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  /* ── tiny stat card helper ── */
  const StatCard = ({
    label,
    value,
    icon: Icon,
    accent,
  }: {
    label: string;
    value: number;
    icon: any;
    accent: string;
  }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}
      >
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );

  /* ── shared table head style ── */
  const thCls =
    "text-xs font-semibold tracking-wider uppercase text-gray-400 py-3 px-4 bg-gray-50/80";
  const tdCls = "py-3 px-4 text-sm text-gray-700 align-middle";

  // @ts-ignore
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ══ TOP NAV ══ */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-amber-400" />
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none">
                EPix Infra
              </p>
              <p className="text-[0.6rem] text-gray-400 tracking-widest uppercase">
                Admin Studio
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-gray-700">{user?.email}</p>
              <p className="text-[0.6rem] text-gray-400">Administrator</p>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-200 rounded-lg px-3 py-2 transition-colors"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-5 py-8 w-full flex-1 space-y-7">
        {/* ══ STAT CARDS ══ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Quote Requests"
            value={contactSubmissions.length}
            icon={Mail}
            accent="bg-amber-400"
          />
          <StatCard
            label="Feedback Reviews"
            value={feedbackSubmissions.length}
            icon={MessageSquare}
            accent="bg-sky-400"
          />
          <StatCard
            label="Portfolio Projects"
            value={projects.length}
            icon={FolderKanban}
            accent="bg-violet-400"
          />
        </div>

        {/* ══ TABS ══ */}
        <Tabs
          defaultValue={activeTab}
          onValueChange={setActiveTab}
          className="space-y-5"
        >
          {/* Tab bar + optional action */}
          <div className="flex items-center justify-between">
            <TabsList className="bg-white border border-gray-200 shadow-sm p-1 rounded-xl h-auto gap-1">
              {[
                { value: "contact", label: "Quote Requests", icon: Mail },
                { value: "feedback", label: "Feedback", icon: MessageSquare },
                { value: "projects", label: "Projects", icon: FolderKanban },
              ].map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-lg data-[state=active]:bg-amber-400 data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-500 transition-all"
                >
                  <Icon size={13} />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {activeTab === "projects" && (
              <Dialog
                open={isAddProjectDialogOpen}
                onOpenChange={setIsAddProjectDialogOpen}
              >
                <DialogTrigger asChild>
                  <button className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors">
                    <PlusCircle size={14} />
                    Add Project
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add New Project</DialogTitle>
                  </DialogHeader>
                  <AddProjectForm
                    onClose={() => setIsAddProjectDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* ── QUOTE REQUESTS TAB ── */}
          <TabsContent value="contact">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Quote Requests
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Home theater inquiries from the quote page
                  </p>
                </div>
                <span className="bg-amber-50 text-amber-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-100">
                  {contactSubmissions.length} total
                </span>
              </div>
              <ScrollArea className="h-[560px]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className={thCls}>Client</th>
                      <th className={thCls}>Contact</th>
                      <th className={thCls}>Audio</th>
                      <th className={thCls}>Screen</th>
                      <th className={thCls}>Budget</th>
                      <th className={thCls}>Timeline</th>
                      <th className={thCls}>Date</th>
                      <th className={`${thCls} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contactSubmissions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-16 text-center text-sm text-gray-300"
                        >
                          No quote requests yet
                        </td>
                      </tr>
                    ) : (
                      contactSubmissions.map((s, i) => (
                        <tr
                          key={s.id}
                          className={`border-b border-gray-50 hover:bg-amber-50/30 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}
                        >
                          <td className={tdCls}>
                            <p className="font-medium text-gray-900">
                              {s.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {s.location || "—"}
                            </p>
                          </td>
                          <td className={tdCls}>
                            <p>{s.email}</p>
                            <p className="text-xs text-gray-400">
                              {s.phone || "—"}
                            </p>
                          </td>
                          <td className={tdCls}>
                            {s.audioLayout ? (
                              <span className="inline-flex items-center bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold px-2.5 py-1 rounded-full">
                                {s.audioLayout}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className={tdCls}>
                            {s.screenSize || (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className={tdCls}>
                            {s.budget || (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className={tdCls}>
                            {s.timeline || (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td
                            className={
                              tdCls + " whitespace-nowrap text-gray-400 text-xs"
                            }
                          >
                            {s.createdAt?.toDate().toLocaleDateString()}
                          </td>
                          <td className={tdCls}>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleView(s)}
                                className="text-xs font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-100 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                View
                              </button>
                              <button
                                onClick={() => confirmDelete(s.id, "contact")}
                                disabled={isDeleting === s.id}
                                className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                              >
                                {isDeleting === s.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* ── FEEDBACK TAB ── */}
          <TabsContent value="feedback">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Customer Feedback
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Reviews and ratings from clients
                  </p>
                </div>
                <span className="bg-sky-50 text-sky-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-sky-100">
                  {feedbackSubmissions.length} total
                </span>
              </div>
              <ScrollArea className="h-[560px]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className={thCls}>Name</th>
                      <th className={thCls}>Company</th>
                      <th className={thCls}>Email</th>
                      <th className={thCls}>Rating</th>
                      <th className={thCls}>Feedback</th>
                      <th className={thCls}>Date</th>
                      <th className={`${thCls} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbackSubmissions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-16 text-center text-sm text-gray-300"
                        >
                          No feedback yet
                        </td>
                      </tr>
                    ) : (
                      feedbackSubmissions.map((s, i) => (
                        <tr
                          key={s.id}
                          className={`border-b border-gray-50 hover:bg-sky-50/30 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}
                        >
                          <td className={tdCls + " font-medium text-gray-900"}>
                            {s.name}
                          </td>
                          <td className={tdCls}>
                            {s.company || (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className={tdCls}>
                            {s.email || (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className={tdCls}>
                            {s.rating != null ? (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold px-2.5 py-1 rounded-full">
                                ★ {s.rating}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className={tdCls + " max-w-[220px]"}>
                            <p className="truncate text-gray-600">
                              {s.feedback}
                            </p>
                          </td>
                          <td
                            className={
                              tdCls + " text-xs text-gray-400 whitespace-nowrap"
                            }
                          >
                            {s.createdAt?.toDate().toLocaleDateString()}
                          </td>
                          <td className={tdCls}>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(s)}
                                className="p-1.5 rounded-lg text-gray-300 hover:text-sky-500 hover:bg-sky-50 transition-colors"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => confirmDelete(s.id, "feedback")}
                                disabled={isDeleting === s.id}
                                className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                              >
                                {isDeleting === s.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* ── PROJECTS TAB ── */}
          <TabsContent value="projects">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Portfolio Projects
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Manage your public project showcase
                  </p>
                </div>
                <span className="bg-violet-50 text-violet-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-violet-100">
                  {projects.length} total
                </span>
              </div>
              <ScrollArea className="h-[560px]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className={thCls}>Preview</th>
                      <th className={thCls}>Project Name</th>
                      <th className={thCls}>Category</th>
                      <th className={`${thCls} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-16 text-center text-sm text-gray-300"
                        >
                          No projects yet
                        </td>
                      </tr>
                    ) : (
                      projects.map((p, i) => (
                        <tr
                          key={p.id}
                          className={`border-b border-gray-50 hover:bg-violet-50/20 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}
                        >
                          <td className={tdCls}>
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="h-11 w-16 rounded-lg object-cover border border-gray-100 shadow-sm"
                            />
                          </td>
                          <td className={tdCls + " font-medium text-gray-900"}>
                            {p.name}
                          </td>
                          <td className={tdCls}>
                            <span className="inline-flex bg-violet-50 text-violet-700 border border-violet-100 text-xs font-semibold px-2.5 py-1 rounded-full">
                              {p.category}
                            </span>
                          </td>
                          <td className={tdCls}>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(p)}
                                className="p-1.5 rounded-lg text-gray-300 hover:text-violet-500 hover:bg-violet-50 transition-colors"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => confirmDelete(p.id, "projects")}
                                disabled={isDeleting === p.id}
                                className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                              >
                                {isDeleting === p.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ══ EDIT DIALOG ══ */}
      {selectedSubmission && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">
                Edit{" "}
                {activeTab === "contact"
                  ? "Quote Request"
                  : activeTab === "feedback"
                    ? "Feedback"
                    : "Project"}
              </DialogTitle>
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

      {/* ══ VIEW DIALOG ══ */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Quote Request Details
            </DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-5 text-sm mt-1">
              {/* Contact */}
              <div>
                <p className="text-[0.6rem] font-bold tracking-[0.18em] uppercase text-gray-400 mb-2.5">
                  Contact Info
                </p>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl border border-gray-100 p-4">
                  {[
                    { l: "Name", v: selectedSubmission.name },
                    { l: "Phone", v: selectedSubmission.phone },
                    { l: "Email", v: selectedSubmission.email },
                    { l: "Location", v: selectedSubmission.location },
                  ].map(({ l, v }) => (
                    <div key={l}>
                      <p className="text-[0.6rem] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
                        {l}
                      </p>
                      <p className="font-medium text-gray-800">{v || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* HT Spec */}
              <div>
                <p className="text-[0.6rem] font-bold tracking-[0.18em] uppercase text-gray-400 mb-2.5">
                  Theater Specifications
                </p>
                <div className="grid grid-cols-2 gap-3 bg-amber-50/60 rounded-xl border border-amber-100 p-4">
                  <div>
                    <p className="text-[0.6rem] uppercase tracking-wider text-amber-500/70 font-semibold mb-0.5">
                      Audio Layout
                    </p>
                    <p className="font-semibold text-amber-700 text-base">
                      {selectedSubmission.audioLayout || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.6rem] uppercase tracking-wider text-amber-500/70 font-semibold mb-0.5">
                      Screen Size
                    </p>
                    <p className="font-medium text-gray-800">
                      {selectedSubmission.screenSize || "—"}
                    </p>
                  </div>
                  {selectedSubmission.roomDimensions && (
                    <div className="col-span-2">
                      <p className="text-[0.6rem] uppercase tracking-wider text-amber-500/70 font-semibold mb-0.5">
                        Room Dimensions
                      </p>
                      <p className="font-medium text-gray-800">
                        {selectedSubmission.roomDimensions.length}L ×{" "}
                        {selectedSubmission.roomDimensions.width}W ×{" "}
                        {selectedSubmission.roomDimensions.height}H ft
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Brands */}
              {(selectedSubmission.processorBrands?.length ||
                selectedSubmission.avrBrands?.length ||
                selectedSubmission.powerAmpBrands?.length ||
                selectedSubmission.speakerBrands?.length ||
                selectedSubmission.subwooferBrands?.length) && (
                <div>
                  <p className="text-[0.6rem] font-bold tracking-[0.18em] uppercase text-gray-400 mb-2.5">
                    Preferred Brands
                  </p>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-3">
                    {[
                      {
                        label: "Processors",
                        brands: selectedSubmission.processorBrands,
                      },
                      { label: "AVR", brands: selectedSubmission.avrBrands },
                      {
                        label: "Power Amps",
                        brands: selectedSubmission.powerAmpBrands,
                      },
                      {
                        label: "Speakers",
                        brands: selectedSubmission.speakerBrands,
                      },
                      {
                        label: "Subwoofers",
                        brands: selectedSubmission.subwooferBrands,
                      },
                    ]
                      .filter((r) => r.brands?.length)
                      .map(({ label, brands }) => (
                        <div key={label} className="flex items-start gap-3">
                          <span className="text-xs text-gray-400 min-w-[80px] pt-0.5">
                            {label}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {brands.map((b) => (
                              <span
                                key={b}
                                className="inline-flex bg-white border border-gray-200 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm"
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Project details */}
              <div>
                <p className="text-[0.6rem] font-bold tracking-[0.18em] uppercase text-gray-400 mb-2.5">
                  Project Details
                </p>
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[0.6rem] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
                        Budget
                      </p>
                      <p className="font-medium text-gray-800">
                        {selectedSubmission.budget || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.6rem] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
                        Timeline
                      </p>
                      <p className="font-medium text-gray-800">
                        {selectedSubmission.timeline || "—"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[0.6rem] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                      Vision
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedSubmission.message}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-300 text-right">
                Submitted{" "}
                {selectedSubmission.createdAt?.toDate().toLocaleString()}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ══ DELETE CONFIRM ══ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray-900">
              Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 mt-1">
            Are you sure you want to permanently delete this {deleteInfo?.type}?
            This cannot be undone.
          </p>
          <DialogFooter className="mt-4 gap-2">
            <button
              onClick={() => setIsDeleteDialogOpen(false)}
              className="flex-1 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-4 py-2.5 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="flex-1 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg px-4 py-2.5 transition-colors"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
