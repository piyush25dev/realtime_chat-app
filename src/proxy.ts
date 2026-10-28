import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getRoom } from "./lib/firebase-admin";

export const proxy = async (req: NextRequest) => {
  const match = req.nextUrl.pathname.match(/^\/room\/([^/]+)\/?$/);
  if (!match) return NextResponse.next();
  const roomId = match[1];
  const room = await getRoom(roomId);
  if (!room || room.data.destroyed) return NextResponse.redirect(new URL("/?error=room-not-found", req.url));
  const existingToken = req.cookies.get("x-auth-token")?.value;
  if (existingToken && room.data.connected.includes(existingToken)) return NextResponse.next();
  if (room.data.connected.length >= 2) return NextResponse.redirect(new URL("/?error=room-full", req.url));
  const token = nanoid();
  await room.ref.update({ connected: [...room.data.connected, token] });
  const response = NextResponse.next();
  response.cookies.set("x-auth-token", token, { path: "/", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", expires: room.data.expiresAt });
  return response;
};

export const config = { matcher: "/room/:path*" };
