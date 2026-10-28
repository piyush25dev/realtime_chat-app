import { NextResponse } from "next/server";
export const GET = () => NextResponse.json({ error: "Realtime endpoint removed; use the protected messages API." }, { status: 410 });
