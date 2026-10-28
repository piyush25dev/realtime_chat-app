import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { ChatMessage, db, getRoom, ROOM_TTL_SECONDS, RoomData } from "@/lib/firebase-admin";

function unauthorized(message = "Unauthorized") { return NextResponse.json({ error: message }, { status: 401 }); }
function badRequest(message: string, status = 400) { return NextResponse.json({ error: message }, { status }); }
async function authorizedRoom(request: NextRequest, roomId: string) {
  const token = request.cookies.get("x-auth-token")?.value;
  if (!token) return null;
  const room = await getRoom(roomId);
  if (!room || room.data.destroyed || !room.data.connected.includes(token)) return null;
  return { ...room, token };
}

export async function GET(request: NextRequest) {
  const path = new URL(request.url).pathname.replace(/^\/api\/?/, "");
  const roomId = new URL(request.url).searchParams.get("roomId") || "";
  if (path === "room/ttl") {
    const room = await authorizedRoom(request, roomId);
    if (!room) return unauthorized();
    return NextResponse.json({ ttl: Math.max(0, Math.ceil((room.data.expiresAt.getTime() - Date.now()) / 1000)) });
  }
  if (path === "messages") {
    const room = await authorizedRoom(request, roomId);
    if (!room) return unauthorized();
    const snapshot = await room.ref.collection("messages").orderBy("timestamp", "asc").get();
    const messages = snapshot.docs.map(doc => {
      const message = doc.data() as ChatMessage;
      return { ...message, token: message.token === room.token ? message.token : undefined };
    });
    return NextResponse.json({ messages });
  }
  return badRequest("Not found", 404);
}

export async function POST(request: NextRequest) {
  const path = new URL(request.url).pathname.replace(/^\/api\/?/, "");
  if (path === "room/create") {
    const roomId = nanoid();
    const now = Date.now();
    const room: RoomData = { createdAt: now, expiresAt: new Date(now + ROOM_TTL_SECONDS * 1000), connected: [] };
    await db().collection("rooms").doc(roomId).set(room);
    return NextResponse.json({ roomId });
  }
  if (path === "messages") {
    const roomId = new URL(request.url).searchParams.get("roomId") || "";
    const room = await authorizedRoom(request, roomId);
    if (!room) return unauthorized();
    const body = await request.json().catch(() => null) as { sender?: string; text?: string } | null;
    const sender = body?.sender?.trim();
    const text = body?.text?.trim();
    if (!sender || sender.length > 100 || !text || text.length > 1000) return badRequest("Sender and message are required; maximum lengths are 100 and 1000 characters.");
    const message: ChatMessage = { id: nanoid(), sender, text, timestamp: Date.now(), roomId, token: room.token, expiresAt: room.data.expiresAt };
    await room.ref.collection("messages").doc(message.id).set(message);
    return NextResponse.json({ ok: true });
  }
  return badRequest("Not found", 404);
}

export async function DELETE(request: NextRequest) {
  const path = new URL(request.url).pathname.replace(/^\/api\/?/, "");
  if (path !== "messages") return badRequest("Not found", 404);
  const roomId = new URL(request.url).searchParams.get("roomId") || "";
  const room = await authorizedRoom(request, roomId);
  if (!room) return unauthorized();
  const messages = await room.ref.collection("messages").get();
  const batch = db().batch();
  messages.docs.forEach(doc => batch.delete(doc.ref));
  batch.delete(room.ref);
  await batch.commit();
  return NextResponse.json({ ok: true });
}
