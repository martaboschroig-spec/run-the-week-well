// Browser side of phone alerts: asks the browser for permission, then hands the device
// token to the app so alerts can be sent to this phone.

import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, deleteToken } from "firebase/messaging";

const appId = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID as string | undefined;
const vapidKey = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY as string | undefined;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY as string | undefined,
  projectId: import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID as string | undefined,
  appId,
  // Firebase derives the sender id from the app id: "1:<senderId>:web:<hash>"
  messagingSenderId: appId?.split(":")[1] ?? "",
};

export type PushResult =
  | { status: "registered"; token: string }
  | { status: "not-configured" | "unsupported" | "open-in-new-tab" | "denied" };

export function pushIsConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && appId && vapidKey && firebaseConfig.messagingSenderId);
}

/** Call from a click handler — browsers ignore permission requests without one. */
export async function enablePush(): Promise<PushResult> {
  if (!pushIsConfigured()) return { status: "not-configured" };
  if (!("Notification" in window) || !(await isSupported())) return { status: "unsupported" };
  // The editor preview sits inside a frame; browsers only allow the prompt on a full page.
  if (window.top !== window.self) return { status: "open-in-new-tab" };

  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return { status: "denied" };

  const query = new URLSearchParams(firebaseConfig as Record<string, string>).toString();
  const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`);
  const messaging = getMessaging(initializeApp(firebaseConfig as any));
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
  return token ? { status: "registered", token } : { status: "denied" };
}

export async function disablePush(): Promise<boolean> {
  if (!pushIsConfigured()) return false;
  try {
    const registration = await navigator.serviceWorker.getRegistration("/");
    const messaging = getMessaging(initializeApp(firebaseConfig as any));
    await deleteToken(messaging);
    await registration?.unregister();
    return true;
  } catch {
    return false;
  }
}
