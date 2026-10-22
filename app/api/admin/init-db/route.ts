import { NextResponse } from "next/server";
import { ensureDatabaseTablesExist } from "@/lib/dbInit";

export async function GET() {
  try {
    const result = await ensureDatabaseTablesExist();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Init failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await ensureDatabaseTablesExist();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Init failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
