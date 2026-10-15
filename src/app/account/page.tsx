"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  UserIcon,
  PhoneIcon,
  MailIcon,
  BackArrowIcon,
} from "@/components/Icons";

/* ─── Mock User Data ─── */
const mockUser = {
  name: "Priya Sharma",
  phone: "+91 98765 43210",
  email: "priya.sharma@email.com",
  avatar: "P",
  memberSince: "October 2026",
};

/* ─── Account Menu Item Component ─── */
function AccountMenuItem({
  icon,
  title,
  description,
  badge,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  delay: number;
}) {
  return (
    <div
      className="account-card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "12px",
          background: "linear-gradient(135deg, #FAF7F2, #EDE4DA)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: "#866951",
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "14.5px",
              fontWeight: 600,
              color: "#261B13",
            }}
          >
            {title}
          </h3>
          {badge && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "#866951",
                backgroundColor: "#F5EDE4",
                padding: "2px 8px",
                borderRadius: "12px",
                letterSpacing: "0.04em",
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: "12.5px",
            color: "#8E7D70",
            marginTop: "2px",
            lineHeight: 1.3,
          }}
        >
          {description}
        </p>
      </div>
      <span style={{ color: "#C4AB94", fontSize: "18px", flexShrink: 0 }}>
        ›
      </span>
    </div>
  );
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "profile" | "orders">(
    "overview"
  );
  const user = mockUser;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#F7F2EE",
      }}
    >
      <Header />

      {/* Account Hero Banner */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          minHeight: "220px",
        }}
      >
        {/* Background Photo with Gradient */}
        <div style={{ position: "absolute", inset: 0 }}>
          <Image
            src="/images/account_hero.jpg"
            alt=""
            fill
            sizes="100vw"
            style={{
              objectFit: "cover",
              objectPosition: "center 20%",
            }}
            priority
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(38,27,19,0.5) 0%, rgba(38,27,19,0.85) 100%)",
            }}
          />
        </div>

        {/* User Profile Card */}
        <div
          className="fade-in-up"
          style={{
            position: "relative",
            zIndex: 10,
            maxWidth: "640px",
            margin: "0 auto",
            padding: "36px 24px 30px 24px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          {/* Avatar */}
          <div className="account-avatar">{user.avatar}</div>

          {/* User Info */}
          <div>
            <h1
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "28px",
                fontWeight: 500,
                color: "#FFFFFF",
                lineHeight: 1.15,
                marginBottom: "4px",
              }}
            >
              {user.name}
            </h1>
            <p
              style={{
                fontSize: "13px",
                color: "rgba(255,255,255,0.75)",
                marginBottom: "2px",
              }}
            >
              {user.email}
            </p>
            <p
              style={{
                fontSize: "11.5px",
                color: "#C4AB94",
                fontWeight: 500,
                letterSpacing: "0.04em",
              }}
            >
              Member since {user.memberSince}
            </p>
          </div>
        </div>

        {/* Decorative Botanical Corner */}
        <div
          style={{
            position: "absolute",
            right: "-20px",
            bottom: "-20px",
            width: "160px",
            height: "160px",
            pointerEvents: "none",
            opacity: 0.2,
            zIndex: 5,
          }}
        >
          <Image
            src="/images/botanical_flowers.jpg"
            alt=""
            fill
            style={{ objectFit: "contain" }}
          />
        </div>
      </section>

      {/* Tab Navigation */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E8DED3",
          position: "sticky",
          top: "0",
          zIndex: 60,
        }}
      >
        <div
          style={{
            maxWidth: "640px",
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            gap: "0",
          }}
        >
          {(
            [
              { key: "overview", label: "Overview" },
              { key: "profile", label: "Profile" },
              { key: "orders", label: "Orders" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "14px 20px",
                fontSize: "13px",
                fontWeight: activeTab === tab.key ? 600 : 500,
                color:
                  activeTab === tab.key ? "#261B13" : "#8E7D70",
                borderBottom:
                  activeTab === tab.key
                    ? "2px solid #866951"
                    : "2px solid transparent",
                transition: "all 0.2s ease",
                letterSpacing: "0.02em",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          maxWidth: "640px",
          width: "100%",
          margin: "0 auto",
          padding: "24px 24px 48px 24px",
        }}
      >
        {activeTab === "overview" && (
          <div className="stagger-children" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Quick Stats */}
            <div
              className="glass-card"
              style={{
                padding: "20px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "16px",
                textAlign: "center",
                marginBottom: "8px",
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: "28px",
                    fontWeight: 600,
                    color: "#261B13",
                    display: "block",
                  }}
                >
                  0
                </span>
                <span style={{ fontSize: "11px", color: "#8E7D70", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Orders
                </span>
              </div>
              <div style={{ borderLeft: "1px solid #E8DED3", borderRight: "1px solid #E8DED3" }}>
                <span
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: "28px",
                    fontWeight: 600,
                    color: "#261B13",
                    display: "block",
                  }}
                >
                  0
                </span>
                <span style={{ fontSize: "11px", color: "#8E7D70", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Wishlist
                </span>
              </div>
              <div>
                <span
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: "28px",
                    fontWeight: 600,
                    color: "#261B13",
                    display: "block",
                  }}
                >
                  0
                </span>
                <span style={{ fontSize: "11px", color: "#8E7D70", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Reviews
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <AccountMenuItem
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              }
              title="My Orders"
              description="Track orders, request returns & view history"
              delay={100}
            />

            <AccountMenuItem
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              }
              title="Wishlist"
              description="Your curated collection of favourites"
              delay={150}
            />

            <AccountMenuItem
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              }
              title="Saved Addresses"
              description="Manage your delivery addresses"
              badge="1 saved"
              delay={200}
            />

            <AccountMenuItem
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              }
              title="Payment Methods"
              description="Manage cards, UPI & payment preferences"
              delay={250}
            />

            <AccountMenuItem
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              }
              title="Account Settings"
              description="Edit profile, notifications & preferences"
              delay={300}
            />

            <AccountMenuItem
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              }
              title="Help & Support"
              description="FAQs, contact us & care instructions"
              delay={350}
            />

            {/* Sign Out Button */}
            <div style={{ marginTop: "12px" }}>
              <button
                onClick={() => {}}
                style={{
                  width: "100%",
                  height: "48px",
                  background: "transparent",
                  border: "1px solid #E6DACF",
                  borderRadius: "14px",
                  fontSize: "13.5px",
                  fontWeight: 500,
                  color: "#866951",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                }}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Profile Details Card */}
            <div
              className="glass-card"
              style={{ padding: "24px" }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "22px",
                  fontWeight: 500,
                  color: "#261B13",
                  marginBottom: "20px",
                }}
              >
                Personal Information
              </h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {/* Name */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 16px",
                    background: "#FCFAF7",
                    borderRadius: "12px",
                    border: "1px solid #F0E8DE",
                  }}
                >
                  <UserIcon size={18} color="#866951" />
                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#8E7D70",
                        fontWeight: 500,
                        display: "block",
                        marginBottom: "2px",
                      }}
                    >
                      Full Name
                    </span>
                    <span
                      style={{
                        fontSize: "14.5px",
                        color: "#261B13",
                        fontWeight: 500,
                      }}
                    >
                      {user.name}
                    </span>
                  </div>
                </div>

                {/* Phone */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 16px",
                    background: "#FCFAF7",
                    borderRadius: "12px",
                    border: "1px solid #F0E8DE",
                  }}
                >
                  <PhoneIcon size={18} color="#866951" />
                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#8E7D70",
                        fontWeight: 500,
                        display: "block",
                        marginBottom: "2px",
                      }}
                    >
                      Mobile Number
                    </span>
                    <span
                      style={{
                        fontSize: "14.5px",
                        color: "#261B13",
                        fontWeight: 500,
                      }}
                    >
                      {user.phone}
                    </span>
                  </div>
                </div>

                {/* Email */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 16px",
                    background: "#FCFAF7",
                    borderRadius: "12px",
                    border: "1px solid #F0E8DE",
                  }}
                >
                  <MailIcon size={18} color="#866951" />
                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#8E7D70",
                        fontWeight: 500,
                        display: "block",
                        marginBottom: "2px",
                      }}
                    >
                      Email Address
                    </span>
                    <span
                      style={{
                        fontSize: "14.5px",
                        color: "#261B13",
                        fontWeight: 500,
                      }}
                    >
                      {user.email}
                    </span>
                  </div>
                </div>
              </div>

              <button
                className="avsaraa-btn-outline"
                style={{
                  height: "46px",
                  marginTop: "20px",
                  fontSize: "13px",
                }}
              >
                Edit Profile
              </button>
            </div>

            {/* Membership Badge */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, #261B13 0%, #3A2A1F 50%, #261B13 100%)",
                borderRadius: "20px",
                padding: "24px",
                color: "#FFFFFF",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Decorative Gold Pattern */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "180px",
                  height: "100%",
                  opacity: 0.08,
                  background:
                    "repeating-linear-gradient(45deg, #C4AB94 0px, #C4AB94 1px, transparent 1px, transparent 12px)",
                }}
              />

              <div style={{ position: "relative", zIndex: 1 }}>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "#C4AB94",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  AVSARAA MEMBER
                </span>
                <h3
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: "22px",
                    fontWeight: 500,
                    color: "#FFFFFF",
                    marginBottom: "4px",
                  }}
                >
                  {user.name}
                </h3>
                <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.6)" }}>
                  Since {user.memberSince} · Classic Tier
                </p>

                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px 16px",
                    background: "rgba(196, 171, 148, 0.12)",
                    borderRadius: "12px",
                    border: "1px solid rgba(196, 171, 148, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span style={{ color: "#C4AB94", fontSize: "16px" }}>✦</span>
                  <span style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.85)" }}>
                    Shop more to unlock VIP early access & exclusive styling sessions
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="fade-in" style={{ textAlign: "center", padding: "48px 20px" }}>
            {/* Empty State */}
            <div style={{ animation: "float 3s ease-in-out infinite" }}>
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#CFBEAD"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ margin: "0 auto 20px auto", display: "block" }}
              >
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "24px",
                fontWeight: 500,
                color: "#261B13",
                marginBottom: "8px",
              }}
            >
              No orders yet
            </h2>
            <p
              style={{
                fontSize: "13.5px",
                color: "#8E7D70",
                lineHeight: 1.5,
                maxWidth: "320px",
                margin: "0 auto 24px auto",
              }}
            >
              Your style journey is about to begin. Explore our curated collections and find something you love.
            </p>
            <Link
              href="/"
              className="avsaraa-btn-primary"
              style={{
                display: "inline-flex",
                width: "auto",
                padding: "0 32px",
                height: "48px",
                fontSize: "13.5px",
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              Explore Collections →
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
