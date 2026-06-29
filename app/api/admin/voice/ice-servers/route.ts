import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin/auth";

let turnWarningLogged = false;

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const iceServers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  const turnUrl = process.env.VOICE_TURN_URL;
  const turnUsername = process.env.VOICE_TURN_USERNAME;
  const turnCredential = process.env.VOICE_TURN_CREDENTIAL;

  if (turnUrl && turnUsername && turnCredential) {
    iceServers.push({
      urls: turnUrl,
      username: turnUsername,
      credential: turnCredential,
    });
  } else if (!turnWarningLogged && process.env.NODE_ENV === "development") {
    console.warn(
      "[voice] VOICE_TURN_* not set — STUN only. Configure TURN for mobile NAT.",
    );
    turnWarningLogged = true;
  }

  return NextResponse.json({ iceServers });
}
