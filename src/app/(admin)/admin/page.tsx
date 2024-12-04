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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
          toast.error("Failed to fetch contact submissions");
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
          toast.error("Failed to fetch projects");
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
    try {
      setIsDeleting(id);
      await deleteDoc(doc(db, type, id));
      toast.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`
      );
    } catch (error) {
      console.error(`Error deleting ${type} submission:`, error);
      toast.error(`Failed to delete ${type}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEdit = (
    submission: FeedbackSubmission | ContactSubmission | Project
  ) => {
    setSelectedSubmission(submission);
    setEditMode(true);
    setIsEditDialogOpen(true);
  };

  const handleView = (
    submission: FeedbackSubmission | ContactSubmission | Project
  ) => {
    setSelectedSubmission(submission);
    setIsViewDialogOpen(true);
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
      toast.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`
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
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // @ts-ignore
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4 md:px-6">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <div className="ml-auto flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6">
        <Tabs
          defaultValue={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="feedback" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Feedback
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                Projects
              </TabsTrigger>
            </TabsList>

            {activeTab === "projects" && (
              <Dialog
                open={isAddProjectDialogOpen}
                onOpenChange={setIsAddProjectDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Add Project
                  </Button>
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

          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Feedback Submissions</CardTitle>
                <CardDescription>
                  Manage and review customer feedback submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Feedback</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feedbackSubmissions.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center text-muted-foreground"
                          >
                            No feedback submissions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        feedbackSubmissions.map((submission) => (
                          <TableRow key={submission.id}>
                            <TableCell className="font-medium">
                              {submission.name}
                            </TableCell>
                            <TableCell>{submission.company || "N/A"}</TableCell>
                            <TableCell>{submission.email || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {submission.rating ?? "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {submission.feedback}
                            </TableCell>
                            <TableCell>
                              {submission.createdAt
                                ?.toDate()
                                .toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(submission)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    confirmDelete(submission.id, "feedback")
                                  }
                                  disabled={isDeleting === submission.id}
                                >
                                  {isDeleting === submission.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Submissions</CardTitle>
                <CardDescription>
                  Manage and review contact form submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Room Dimensions</TableHead>
                        <TableHead>Number of Rooms</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contactSubmissions.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center text-muted-foreground"
                          >
                            No contact submissions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        contactSubmissions.map((submission) => (
                          <TableRow key={submission.id}>
                            <TableCell className="font-medium">
                              {submission.name}
                            </TableCell>
                            <TableCell>{submission.email}</TableCell>
                            <TableCell>{submission.service || "N/A"}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {submission.message}
                            </TableCell>
                            <TableCell>
                              {submission.roomDimensions ? (
                                <div>
                                  <div>
                                    Length: {submission.roomDimensions.length}
                                  </div>
                                  <div>
                                    Width: {submission.roomDimensions.width}
                                  </div>
                                  <div>
                                    Height: {submission.roomDimensions.height}
                                  </div>
                                </div>
                              ) : (
                                "N/A"
                              )}
                            </TableCell>
                            <TableCell>
                              {submission.numberOfRooms || "N/A"}
                            </TableCell>
                            <TableCell>
                              {submission.createdAt
                                ?.toDate()
                                .toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleView(submission)}
                                >
                                  View
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(submission)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    confirmDelete(submission.id, "contact")
                                  }
                                  disabled={isDeleting === submission.id}
                                >
                                  {isDeleting === submission.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Projects</CardTitle>
                <CardDescription>
                  Manage and organize your portfolio projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Preview</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground"
                          >
                            No projects found
                          </TableCell>
                        </TableRow>
                      ) : (
                        projects.map((project) => (
                          <TableRow key={project.id}>
                            <TableCell>
                              <img
                                src={project.imageUrl}
                                alt={project.name}
                                className="h-12 w-12 rounded-md object-cover"
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {project.name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {project.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(project)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    confirmDelete(project.id, "projects")
                                  }
                                  disabled={isDeleting === project.id}
                                >
                                  {isDeleting === project.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {selectedSubmission && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Edit {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}{" "}
                Submission
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

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Submission</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div>
              <p>
                <strong>Name:</strong> {selectedSubmission.name}
              </p>
              <p>
                <strong>Email:</strong> {selectedSubmission.email}
              </p>
              <p>
                <strong>Message:</strong> {selectedSubmission.message}
              </p>
              {selectedSubmission.roomDimensions && (
                <div>
                  <p>
                    <strong>Room Dimensions:</strong>
                  </p>
                  <p>Length: {selectedSubmission.roomDimensions.length}</p>
                  <p>Width: {selectedSubmission.roomDimensions.width}</p>
                  <p>Height: {selectedSubmission.roomDimensions.height}</p>
                </div>
              )}
              <p>
                <strong>Number of Rooms:</strong>{" "}
                {selectedSubmission.numberOfRooms || "N/A"}
              </p>
              <p>
                <strong>Service:</strong> {selectedSubmission.service || "N/A"}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this {deleteInfo?.type}?</p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
