"use client";

import React, { useState } from "react";
import { StarIcon, CloseIcon, CameraIcon, SpinnerIcon, CheckIcon } from "@/components/Icons";
import { ProductReview } from "@/types/review";
import { useCart } from "@/context/CartContext";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted?: (newReview: ProductReview) => void;
  productId?: string;
  productName?: string;
}

export default function ReviewModal({
  isOpen,
  onClose,
  onReviewSubmitted,
  productId = "prod-1",
  productName = "Royal Banarasi Katan Silk Saree",
}: ReviewModalProps) {
  const { showToast } = useCart();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }
    if (!comment.trim() || comment.trim().length < 5) {
      setErrorMsg("Please write at least a sentence about your heirloom experience.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const photos = photoUrl.trim() ? [photoUrl.trim()] : [];

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          product_name: productName,
          customer_name: customerName,
          customer_email: customerEmail || null,
          customer_city: customerCity || null,
          rating,
          title: title || null,
          comment,
          photos,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Your review and media have been shared with our atelier!");
        if (onReviewSubmitted && data.review) {
          onReviewSubmitted(data.review as ProductReview);
        }
        onClose();
      } else {
        throw new Error(data.error || "Failed to submit review.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission error";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(38,27,19,0.7)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "540px",
          padding: "32px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          border: "1px solid #EAE0D5",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
          <div>
            <span
              style={{
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#C5A059",
                fontWeight: 700,
              }}
            >
              ✦ Patron Voices & Heirlooms
            </span>
            <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#261B13", fontFamily: "var(--font-serif), Georgia, serif", marginTop: "4px" }}>
              Share Your Drape Story
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#866951",
              cursor: "pointer",
              padding: "6px",
            }}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              backgroundColor: "#FFF5F5",
              border: "1px solid #FCA5A5",
              color: "#DC2626",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Star Rating Select */}
          <div>
            <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#866951", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
              Your Rating
            </label>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    transition: "transform 0.15s ease",
                    transform: (hoverRating || rating) >= star ? "scale(1.15)" : "scale(1)",
                  }}
                >
                  <StarIcon size={24} color="#C5A059" filled={(hoverRating || rating) >= star} />
                </button>
              ))}
              <span style={{ fontSize: "13px", color: "#866951", fontWeight: 600, marginLeft: "8px" }}>
                {rating === 5 ? "Exceptional Heirloom (5/5)" : `${rating} of 5 Stars`}
              </span>
            </div>
          </div>

          {/* Customer Name & City */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#866951", textTransform: "uppercase", marginBottom: "6px" }}>
                Your Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Gayatri Sharma"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #CFBEAD",
                  backgroundColor: "#FCFAF7",
                  fontSize: "13.5px",
                  color: "#261B13",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#866951", textTransform: "uppercase", marginBottom: "6px" }}>
                City / Region
              </label>
              <input
                type="text"
                value={customerCity}
                onChange={(e) => setCustomerCity(e.target.value)}
                placeholder="e.g. Mumbai, Surat, London"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #CFBEAD",
                  backgroundColor: "#FCFAF7",
                  fontSize: "13.5px",
                  color: "#261B13",
                }}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#866951", textTransform: "uppercase", marginBottom: "6px" }}>
              Email Address (Kept Private)
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="e.g. gayatri@example.com"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #CFBEAD",
                backgroundColor: "#FCFAF7",
                fontSize: "13.5px",
                color: "#261B13",
              }}
            />
          </div>

          {/* Review Title */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#866951", textTransform: "uppercase", marginBottom: "6px" }}>
              Headline / Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pure royalty! Received endless compliments"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #CFBEAD",
                backgroundColor: "#FCFAF7",
                fontSize: "13.5px",
                color: "#261B13",
              }}
            />
          </div>

          {/* Review Comment */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#866951", textTransform: "uppercase", marginBottom: "6px" }}>
              Your Review & Experience *
            </label>
            <textarea
              required
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe how the drape felt, the zari luster in evening light, craftsmanship, or the atelier presentation..."
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #CFBEAD",
                backgroundColor: "#FCFAF7",
                fontSize: "13.5px",
                color: "#261B13",
                lineHeight: "1.5",
                resize: "vertical",
              }}
            />
          </div>

          {/* Real Customer Photo URL input */}
          <div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11px",
                fontWeight: 700,
                color: "#866951",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              <CameraIcon size={13} color="#866951" />
              <span>Patron Photo (URL)</span>
            </label>
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="/images/... or image URL (optional)"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #CFBEAD",
                backgroundColor: "#FCFAF7",
                fontSize: "12.5px",
                color: "#261B13",
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 18px",
                borderRadius: "8px",
                border: "1px solid #CFBEAD",
                backgroundColor: "#FAF7F2",
                color: "#866951",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 22px",
                borderRadius: "8px",
                backgroundColor: "#261B13",
                color: "#F7F2EE",
                fontSize: "13px",
                fontWeight: 600,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(38,27,19,0.15)",
              }}
            >
              {isSubmitting ? <SpinnerIcon size={16} color="#F7F2EE" /> : <CheckIcon size={14} color="#C5A059" />}
              <span>{isSubmitting ? "Submitting..." : "Post Review"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
