import { useState, useEffect, createContext, useContext } from "react";

export interface StudentProfile {
  id: string;
  email: string;
  name: string;
  nationality?: string | null;
  residence?: string | null;
  dateOfBirth?: string | null;
  educationLevel?: string | null;
  gpa?: string | null;
  fieldOfStudy?: string | null;
  graduationYear?: number | null;
  englishLevel?: string | null;
  ieltsScore?: string | null;
  toeflScore?: number | null;
  targetLevel?: string[] | null;
  targetCountry?: string[] | null;
  targetField?: string | null;
  studyTimeline?: string | null;
  passportCountry?: string | null;
  hasVisa?: boolean | null;
  whatsappNumber?: string | null;
  profileComplete?: boolean | null;
  createdAt: string;
  updatedAt: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("scholr_student_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api${path}`, { ...opts, headers: { ...headers, ...(opts.headers as Record<string, string> || {}) } });
  return res;
}

export async function studentRegister(name: string, email: string, password: string) {
  const res = await apiFetch("/student/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  localStorage.setItem("scholr_student_token", data.token);
  return data.student as StudentProfile;
}

export async function studentLogin(email: string, password: string) {
  const res = await apiFetch("/student/login", { method: "POST", body: JSON.stringify({ email, password }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  localStorage.setItem("scholr_student_token", data.token);
  return data.student as StudentProfile;
}

export async function studentLogout() {
  await apiFetch("/student/logout", { method: "POST" });
  localStorage.removeItem("scholr_student_token");
}

export async function getStudentMe(): Promise<StudentProfile | null> {
  const token = localStorage.getItem("scholr_student_token");
  if (!token) return null;
  const res = await apiFetch("/student/me");
  if (!res.ok) {
    localStorage.removeItem("scholr_student_token");
    return null;
  }
  return res.json();
}

export async function updateStudentProfile(updates: Partial<StudentProfile>) {
  const res = await apiFetch("/student/profile", { method: "PUT", body: JSON.stringify(updates) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Update failed");
  return data as StudentProfile;
}

export async function submitApplication(payload: {
  opportunityId: string;
  motivation?: string;
  experience?: string;
  contactPreference?: string;
  whatsappNumber?: string;
  contactTime?: string;
  concerns?: string;
}) {
  const res = await apiFetch("/applications", { method: "POST", body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok && res.status !== 409) throw new Error(data.error || "Submission failed");
  return data;
}

export async function getMyApplications() {
  const res = await apiFetch("/applications");
  if (!res.ok) return [];
  return res.json();
}

// Simple hook
export function useStudentAuth() {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentMe().then((s) => {
      setStudent(s);
      setLoading(false);
    });
  }, []);

  const logout = async () => {
    await studentLogout();
    setStudent(null);
  };

  return { student, setStudent, loading, logout };
}

// Context
import React from "react";

interface StudentAuthContextType {
  student: StudentProfile | null;
  setStudent: (s: StudentProfile | null) => void;
  loading: boolean;
  logout: () => Promise<void>;
}

export const StudentAuthContext = createContext<StudentAuthContextType>({
  student: null,
  setStudent: () => {},
  loading: false,
  logout: async () => {},
});

export function StudentAuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useStudentAuth();
  return React.createElement(StudentAuthContext.Provider, { value: auth }, children);
}

export function useStudent() {
  return useContext(StudentAuthContext);
}
