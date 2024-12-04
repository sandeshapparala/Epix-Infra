// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
/* eslint-disable */
// src/components/admin/EditProjectForm.tsx

import React, { useState } from "react";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "@/lib/firebase";
import { Project } from "@/types";

interface EditProjectFormProps {
    project: Project;
    onUpdate: (updatedProject: Project) => void;
    onClose: () => void;
}

const EditProjectForm: React.FC<EditProjectFormProps> = ({ project, onUpdate, onClose }) => {
    const [formData, setFormData] = useState({
        name: project.name,
        category: project.category,
        imageUrl: project.imageUrl,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let imageUrl = formData.imageUrl;

            if (imageFile) {
                const storage = getStorage();
                const storageRef = ref(storage, `projects/${imageFile.name}`);
                await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(storageRef);
            }

            const updatedProject = {
                ...project,
                name: formData.name,
                category: formData.category,
                imageUrl,
                updatedAt: Timestamp.now(),
            };

            const projectDoc = doc(db, "projects", project.id);
            await updateDoc(projectDoc, updatedProject);

            onUpdate(updatedProject);
            onClose();
        } catch (err) {
            setError("Failed to update the project. Please try again.");
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-screen">
            <label className="block">
                Project Name:
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full mt-1 p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </label>
            <label className="block">
                Category:
                <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full mt-1 p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </label>
            <label className="block">
                Image:
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full mt-1 p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.imageUrl && (
                    <img src={formData.imageUrl} alt="Project" className="mt-2 w-full h-auto rounded-md" />
                )}
            </label>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    className="mr-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                    {loading ? "Updating..." : "Update Project"}
                </button>
            </div>
        </form>
    );
};

export default EditProjectForm;