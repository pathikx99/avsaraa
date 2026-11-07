import { NextResponse } from "next/server";
import { getShiprocketServiceability } from "@/lib/shipping";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get("pincode");

    if (!pincode) {
      return NextResponse.json(
        { success: false, error: "Pincode parameter is required." },
        { status: 400 }
      );
    }

    const result = await getShiprocketServiceability(pincode);
    return NextResponse.json({
      success: true,
      serviceability: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Serviceability check failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
