import { NextResponse } from "next/server";
import { isValidIndianPincode } from "@/lib/financials";
import {
  lookupExactCityByPinPrefix,
  lookupPincodeLocally,
  normalizeIndianStateName,
} from "@/lib/pincodeLookup";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
  const rateCheck = checkRateLimit(`pincode-lookup:${ip}`, 30, 60);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { valid: false, error: `Too many PIN lookup requests. Please retry in ${rateCheck.resetSeconds}s.` },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const pin = (searchParams.get("code") || searchParams.get("pincode") || "").trim();

  if (!isValidIndianPincode(pin)) {
    return NextResponse.json(
      { valid: false, error: "Please enter a valid 6-digit Indian PIN code." },
      { status: 400 }
    );
  }

  // Try official India Post directory first, keeping exact 3-digit metro overrides where preferred
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(pin)}`, {
      signal: AbortSignal.timeout(2500),
      cache: "force-cache",
    });

    if (res.ok) {
      const data = await res.json();
      const first = Array.isArray(data) ? data[0] : null;
      const po = first?.Status === "Success" && Array.isArray(first.PostOffice) ? first.PostOffice[0] : null;

      if (po?.District && po?.State) {
        const cleanedDistrict =
          String(po.District)
            .replace(/\bCentral\b|\bSouth\b|\bNorth\b|\bEast\b|\bWest\b/gi, "")
            .trim() || String(po.District).trim();

        const exactMetro = lookupExactCityByPinPrefix(pin);
        return NextResponse.json({
          valid: true,
          pincode: pin,
          city: exactMetro?.city || cleanedDistrict,
          state: normalizeIndianStateName(String(po.State)),
          source: "postalpincode",
        });
      }
    }
  } catch {
    // Fall back deterministically below
  }

  const localResult = lookupPincodeLocally(pin);
  if (localResult) {
    return NextResponse.json(localResult);
  }

  return NextResponse.json({
    valid: true,
    pincode: pin,
    city: "",
    state: "Gujarat",
    source: "prefix_fallback",
  });
}
