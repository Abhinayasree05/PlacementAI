import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useNotificationStore, type AppNotification } from "../store/useNotificationStore";

// =====================================================================
// hooks/useNotificationListener.ts
// Mounted once at app root (alongside useAuthListener /
// useAgentStatusListener). Live Firestore subscription — no polling,
// no manual refresh.
// =====================================================================

export function useNotificationListener() {
  useEffect(() => {
    let unsub: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsub?.();

      if (!user) {
        useNotificationStore.getState().reset();
        return;
      }

      const q = query(
        collection(db, "users", user.uid, "notifications"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      unsub = onSnapshot(q, (snap) => {
        const list: AppNotification[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            type: data.type,
            title: data.title,
            message: data.message,
            link: data.link ?? undefined,
            read: !!data.read,
            createdAt: data.createdAt ?? null,
          };
        });
        useNotificationStore.getState().setNotifications(list);
      });
    });

    return () => {
      unsubAuth();
      unsub?.();
    };
  }, []);
}
