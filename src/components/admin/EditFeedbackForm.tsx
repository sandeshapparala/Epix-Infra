// src/components/EditFeedbackForm.tsx

import React, { useState } from "react";
import { FeedbackSubmission } from "@/types";

interface EditFeedbackFormProps {
    feedback: FeedbackSubmission;
    onUpdate: (feedback: FeedbackSubmission) => void;
    onClose: () => void;
}

const EditFeedbackForm: React.FC<EditFeedbackFormProps> = ({
                                                               feedback,
                                                               onUpdate,
                                                               onClose,
                                                           }) => {
    const [formData, setFormData] = useState<FeedbackSubmission>(feedback);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            onUpdate(formData);
            onClose();
        } catch (err: any) {
            setError("Failed to update the feedback. Please try again.");
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
                Name:
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </label>
            <label className="block">
                Company:
                <input
                    type="text"
                    name="company"
                    value={formData.company || ""}
                    onChange={handleChange}
                    className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </label>
            <label className="block">
                Email:
                <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </label>
            <label className="block">
                Rating:
                <select
                    name="rating"
                    value={formData.rating ?? ""}
                    onChange={(e) =>
                        setFormData({ ...formData, rating: Number(e.target.value) })
                    }
                    className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Select Rating</option>
                    {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num}>
                            {num}
                        </option>
                    ))}
                </select>
            </label>
            <label className="block">
                Feedback:
                <textarea
                    name="feedback"
                    value={formData.feedback}
                    onChange={handleChange}
                    required
                    className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </label>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    className="mr-2 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    {loading ? "Updating..." : "Update"}
                </button>
            </div>
        </form>
    );
};

export default EditFeedbackForm;
