/**
 * types/user.ts
 * Shape of a user's Firestore profile document (collection: "users", doc id = uid).
 */
export type AuthProvider = "password" | "google.com" | "phone";

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  provider: AuthProvider;
  college?: string;
  department?: string;
  year?: string;
  rollNumber?: string;
  gender?: string;
  skills?: string[];
  createdAt: string;      // ISO string
  lastLoginAt: string;    // ISO string

  // Placement-prep progress fields (surfaced on the dashboard)
  codingScore?: number;
  resumeAtsScore?: number;
  interviewScore?: number;
  aptitudeScore?: number;
}
