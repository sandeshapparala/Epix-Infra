// src/types/index.ts

export interface FeedbackSubmission {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  rating?: number | null;
  feedback: string;
  createdAt: any;
  updatedAt?: any;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: any;
  updatedAt?: any;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  createdAt: any;
  updatedAt?: any;
}