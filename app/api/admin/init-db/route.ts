import { NextResponse } from "next/server";
import { ensureDatabaseTablesExist } from "@/lib/dbInit";

export async function GET() {
  try {
    const result = await ensureDatabaseTablesExist();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Init failed" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await ensureDatabaseTablesExist();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Init failed" }, { status: 500 });
  }
}
