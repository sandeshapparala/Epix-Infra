// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
/* eslint-disable */
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
  // contact
  name: string;
  email: string;
  phone?: string;
  location?: string;
  // meta
  service?: string;
  message: string;
  budget?: string;
  timeline?: string;
  // home theater spec
  audioLayout?: string;
  screenSize?: string;
  roomDimensions?: { length: string; width: string; height: string };
  // brand preferences
  processorBrands?: string[];
  avrBrands?: string[];
  powerAmpBrands?: string[];
  speakerBrands?: string[];
  subwooferBrands?: string[];
  projectorBrands?: string[];
  processorOther?: string;
  avrOther?: string;
  powerAmpOther?: string;
  speakerOther?: string;
  subwooferOther?: string;
  projectorOther?: string;
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