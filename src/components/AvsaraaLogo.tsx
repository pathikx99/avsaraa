import React from "react";
import Image from "next/image";

interface AvsaraaLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  width?: number;
  height?: number;
  priority?: boolean;
}

export default function AvsaraaLogo({
  className = "",
  size = "md",
  width,
  height,
  priority = true,
}: AvsaraaLogoProps) {
  // Official logo dimensions from Docs/4E334A70-2DB1-4B02-9CF4-4064C7C7A495.PNG (1518 x 989)
  const defaultWidth = size === "sm" ? 125 : size === "lg" ? 220 : 165;
  const defaultHeight = Math.round(defaultWidth * (989 / 1518));

  const finalWidth = width || defaultWidth;
  const finalHeight = height || Math.round(finalWidth * (989 / 1518));

  return (
    <div
      className={`avsaraa-brand-logo ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
      }}
    >
      <Image
        src="/images/avsaraa-logo.png"
        alt="AVSARAA - Wear The Moment"
        width={finalWidth}
        height={finalHeight}
        style={{
          width: `${finalWidth}px`,
          height: "auto",
          objectFit: "contain",
          display: "block",
        }}
        priority={priority}
      />
    </div>
  );
}
