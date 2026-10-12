import {
  collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp,
  writeBatch, getDocs, query, where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { NotificationType } from "../store/useNotificationStore";

// =====================================================================
// lib/notificationService.ts
// Called from real app events only (see call sites in ResumePage,
// CodingPage, AptitudePage, InterviewPage, AnalyticsPage, SettingsPage).
// Nothing here generates demo/hardcoded notifications.
// =====================================================================

export async function createNotification(
  uid: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  try {
    const ref = collection(db, "users", uid, "notifications");
    await addDoc(ref, {
      type,
      title,
      message,
      link: link ?? null,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    // Notifications are a non-critical side effect — never let a failure
    // here break the real action (resume save, quiz submit, etc.).
    console.error("Failed to create notification:", err);
  }
}

export async function markNotificationRead(uid: string, id: string): Promise<void> {
  await updateDoc(doc(db, "users", uid, "notifications", id), { read: true });
}

export async function deleteNotification(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "notifications", id));
}

export async function markAllNotificationsRead(uid: string): Promise<void> {
  const ref = collection(db, "users", uid, "notifications");
  const snap = await getDocs(query(ref, where("read", "==", false)));
  if (snap.empty) return;

  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}

export async function clearAllNotifications(uid: string): Promise<void> {
  const ref = collection(db, "users", uid, "notifications");
  const snap = await getDocs(ref);
  if (snap.empty) return;

  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
