// Browser side of phone alerts: asks the browser for permission, then hands the device
// token to the app so alerts can be sent to this phone.

import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, deleteToken } from "firebase/messaging";

const env = (k: string) => (import.meta.env as Record<string, string | undefined>)[k] ?? "";

const appId = env("VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID");
const vapidKey = env("VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY");

const firebaseConfig = {
  apiKey: env("VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY"),
  projectId: env("VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID"),
  appId,
  // Firebase derives the sender id from the app id: "1:<senderId>:web:<hash>"
  messagingSenderId: appId.split(":")[1] ?? "",
};

export type PushResult =
  | { status: "registered"; token: string }
  | { status: "not-configured" | "unsupported" | "open-in-new-tab" | "denied" };

export function pushIsConfigured() {
  return Boolean(
    firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId && vapidKey && firebaseConfig.messagingSenderId,
  );
}

/** Call from a click handler — browsers ignore permission requests without one. */
export async function enablePush(): Promise<PushResult> {
  if (!pushIsConfigured()) return { status: "not-configured" };
  if (!("Notification" in window) || !(await isSupported())) return { status: "unsupported" };
  // The editor preview sits inside a frame; browsers only allow the prompt on a full page.
  if (window.top !== window.self) return { status: "open-in-new-tab" };

  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return { status: "denied" };

  const query = new URLSearchParams(firebaseConfig).toString();
  const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`);
  const messaging = getMessaging(initializeApp(firebaseConfig));
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
  return token ? { status: "registered", token } : { status: "denied" };
}

export async function disablePush(): Promise<boolean> {
  if (!pushIsConfigured()) return false;
  try {
    const registration = await navigator.serviceWorker.getRegistration("/");
    const messaging = getMessaging(initializeApp(firebaseConfig));
    await deleteToken(messaging);
    await registration?.unregister();
    return true;
  } catch {
    return false;
  }
}
