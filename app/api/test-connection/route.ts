// app/api/test-connection/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/utils/mongoose";

export async function GET() {
  try {
    await connectToDatabase();

    return NextResponse.json({
      message: "Connected successfully!",
    });
  } catch (error: any) {
    return NextResponse.json({
      message: "Failed to connect to MongoDB",
      error: error.message, // Return the actual error message for debugging
    });
  }
}
