import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin environment variables. Configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.");
  }
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export const db = () => getFirestore(getAdminApp());
export const ROOM_TTL_SECONDS = 10 * 60;
export type RoomData = { createdAt: number; expiresAt: Date; connected: string[]; destroyed?: boolean };
export type ChatMessage = { id: string; sender: string; text: string; timestamp: number; roomId: string; token?: string; expiresAt?: Date };

export async function getRoom(roomId: string) {
  const ref = db().collection("rooms").doc(roomId);
  const snap = await ref.get();

  if (!snap.exists) return null;

  const rawData = snap.data();
  if (!rawData) return null;

  const rawExpiresAt = rawData.expiresAt;

  const expiresAt: Date =
    rawExpiresAt && typeof rawExpiresAt.toDate === "function"
      ? rawExpiresAt.toDate()
      : rawExpiresAt instanceof Date
        ? rawExpiresAt
        : new Date(rawExpiresAt);

  if (
    Number.isNaN(expiresAt.getTime()) ||
    expiresAt.getTime() <= Date.now()
  ) {
    await ref.delete();
    return null;
  }

  const data = {
    ...rawData,
    expiresAt,
    connected: Array.isArray(rawData.connected)
      ? rawData.connected
      : [],
  } as RoomData;

  return { ref, data };
}
