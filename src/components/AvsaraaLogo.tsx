import React from "react";
import Image from "next/image";

interface AvsaraaLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  width?: number;
  height?: number;
  priority?: boolean;
  variant?: "wordmark" | "crest";
}

export default function AvsaraaLogo({
  className = "",
  size = "md",
  width,
  height,
  priority = true,
  variant = "wordmark",
}: AvsaraaLogoProps) {
  if (variant === "crest") {
    // Official emblem/crest logo (1518 x 989)
    const defaultWidth = size === "sm" ? 125 : size === "lg" ? 220 : 165;
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

  // HD Luxury Wordmark logo: 1940 x 510 master ratio (3.8039:1)
  const defaultWordmarkWidth = size === "sm" ? 135 : size === "lg" ? 190 : 160;
  const finalW = width || defaultWordmarkWidth;
  const finalH = height || Math.round(finalW * (510 / 1940));

  return (
    <div
      className={`avsaraa-brand-wordmark ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
      }}
    >
      <Image
        src="/images/avsaraa_wordmark.png"
        alt="AVSARAA - Wear The Moment"
        width={finalW}
        height={finalH}
        className="avsaraa-wordmark-img"
        style={{
          width: width ? `${width}px` : undefined,
          maxWidth: "100%",
          height: "auto",
          objectFit: "contain",
          display: "block",
        }}
        priority={priority}
      />
    </div>
  );
}
