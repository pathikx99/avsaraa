"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CollectionRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams?.toString();
    const destination = params ? `/products?${params}` : "/products";
    router.replace(destination);
  }, [router, searchParams]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#FAF7F2" }}>
      <p style={{ color: "#8E7D70", fontSize: "14px" }}>Redirecting to Products Catalog...</p>
    </div>
  );
}

export default function CollectionPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#FAF7F2" }}>
          <p style={{ color: "#8E7D70", fontSize: "14px" }}>Redirecting...</p>
        </div>
      }
    >
      <CollectionRedirect />
    </Suspense>
  );
}
