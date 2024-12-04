// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
/* eslint-disable */
// src/components/admin/AddProjectForm.tsx

import React, { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "@/lib/firebase";

interface AddProjectFormProps {
  onClose: () => void;
}

const AddProjectForm: React.FC<AddProjectFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    imageUrl: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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
      let imageUrl = "";

      if (imageFile) {
        const storage = getStorage();
        const storageRef = ref(storage, `projects/${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "projects"), {
        ...formData,
        imageUrl,
        createdAt: Timestamp.now(),
      });

      setSuccess(true);
      setFormData({ name: "", category: "", imageUrl: "" });
      setImageFile(null);
      onClose();
    } catch (err) {
      setError("Failed to add the project. Please try again.");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="w-full mt-1 p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a category</option>
          <option value="Interior">Interior</option>
          <option value="Home Theater">Home Theater</option>
          <option value="Electrical">Electrical</option>
          <option value="Furniture">Furniture</option>
        </select>
      </label>
      <label className="block">
        Image:
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          required
          className="w-full mt-1 p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && (
        <p className="text-green-500 text-sm">Project added successfully!</p>
      )}
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
          {loading ? "Adding..." : "Add Project"}
        </button>
      </div>
    </form>
  );
};

export default AddProjectForm;
