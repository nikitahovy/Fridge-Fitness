import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { v4 as uuid } from "uuid";
import { UploadSession } from "@/lib/types";

export async function POST() {
  const session: UploadSession = {
    id: uuid(),
    status: "pending",
    createdAt: new Date().toISOString(),
    imageUrl: null,
  };
  store.sessions.push(session);
  return NextResponse.json(session, { status: 201 });
}
