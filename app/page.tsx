"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  MessageCircle,
  Store,
  CreditCard,
  ShoppingCart,
  Send,
  Heart,
  Package,
  Globe,
  BarChart3,
  Users,
  Shield,
  Zap,
  Check,
  ChevronDown,
  ChevronUp,
  Star,
  ArrowRight,
  Menu,
  X,
  Smartphone,
  Bell,
  Clock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <style jsx global>{`
        :root {
          --green-50: #f0fdf4;
          --green-100: #dcfce7;
          --green-200: #bbf7d0;
          --green-400: #4ade80;
          --green-500: #22c55e;
          --green-600: #16a34a;
          --green-700: #15803d;
          --gray-50: #f9fafb;
          --gray-100: #f3f4f6;
          --gray-200: #e5e7eb;
          --gray-300: #d1d5db;
          --gray-400: #9ca3af;
          --gray-500: #6b7280;
          --gray-600: #4b5563;
          --gray-700: #374151;
          --gray-800: #1f2937;
          --gray-900: #111827;
        }

        .take-landing {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(180deg, var(--green-50) 0%, #ffffff 50%);
          min-height: 100vh;
          overflow-x: hidden;
        }

        .take-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        @media (min-width: 768px) {
          .take-container {
            padding: 0 32px;
          }
        }

        /* Navigation */
        .take-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          transition: all 0.3s ease;
          padding: 16px 0;
        }

        .take-nav.scrolled {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          padding: 12px 0;
        }

        .take-nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .take-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .take-logo-icon {
          width: 36px;
          height: 36px;
          background: var(--green-500);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .take-logo-text {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: var(--gray-900);
        }

        .take-nav-links {
          display: none;
          align-items: center;
          gap: 32px;
        }

        @media (min-width: 768px) {
          .take-nav-links {
            display: flex;
          }
        }

        .take-nav-link {
          font-size: 15px;
          font-weight: 500;
          color: var(--gray-600);
          text-decoration: none;
          transition: color 0.2s;
        }

        .take-nav-link:hover {
          color: var(--gray-900);
        }

        .take-nav-actions {
          display: none;
          align-items: center;
          gap: 12px;
        }

        @media (min-width: 768px) {
          .take-nav-actions {
            display: flex;
          }
        }

        .take-btn {
          font-size: 14px;
          font-weight: 600;
          border-radius: 100px;
          padding: 10px 20px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
        }

        .take-btn-ghost {
          background: transparent;
          color: var(--gray-600);
        }

        .take-btn-ghost:hover {
          color: var(--gray-900);
        }

        .take-btn-primary {
          background: var(--green-500);
          color: white;
        }

        .take-btn-primary:hover {
          background: var(--green-600);
          transform: translateY(-1px);
        }

        .take-btn-secondary {
          background: white;
          color: var(--gray-700);
          border: 1px solid var(--gray-200);
        }

        .take-btn-secondary:hover {
          border-color: var(--green-500);
          color: var(--green-600);
        }

        .take-btn-dark {
          background: var(--gray-900);
          color: white;
        }

        .take-btn-dark:hover {
          background: var(--gray-800);
        }

        .take-btn-large {
          padding: 14px 28px;
          font-size: 15px;
        }

        .mobile-menu-btn {
          display: flex;
          padding: 8px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--gray-700);
        }

        @media (min-width: 768px) {
          .mobile-menu-btn {
            display: none;
          }
        }

        .mobile-menu {
          position: fixed;
          top: 68px;
          left: 0;
          right: 0;
          background: white;
          border-bottom: 1px solid var(--gray-200);
          padding: 20px;
          z-index: 99;
        }

        .mobile-menu a {
          display: block;
          padding: 12px 0;
          font-size: 16px;
          font-weight: 500;
          color: var(--gray-700);
          text-decoration: none;
          border-bottom: 1px solid var(--gray-100);
        }

        .mobile-menu .take-btn {
          width: 100%;
          justify-content: center;
          margin-top: 16px;
        }

        /* Hero Section */
        .take-hero {
          padding: 140px 0 80px;
          text-align: center;
          position: relative;
        }

        @media (min-width: 768px) {
          .take-hero {
            padding: 160px 0 100px;
          }
        }

        .take-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid var(--gray-200);
          color: var(--gray-600);
          font-size: 13px;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 100px;
          margin-bottom: 24px;
        }

        .take-hero-badge-icon {
          color: var(--green-500);
        }

        .take-hero-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 40px;
          font-weight: 700;
          color: var(--gray-900);
          line-height: 1.1;
          letter-spacing: -1px;
          margin: 0 0 20px;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }

        @media (min-width: 768px) {
          .take-hero-title {
            font-size: 56px;
            letter-spacing: -2px;
          }
        }

        @media (min-width: 1024px) {
          .take-hero-title {
            font-size: 64px;
          }
        }

        .take-hero-subtitle {
          font-size: 17px;
          color: var(--gray-500);
          line-height: 1.6;
          margin: 0 0 32px;
          max-width: 520px;
          margin-left: auto;
          margin-right: auto;
        }

        @media (min-width: 768px) {
          .take-hero-subtitle {
            font-size: 18px;
          }
        }

        .take-hero-buttons {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
          margin-bottom: 60px;
        }

        /* Phone Mockup */
        .take-phone-container {
          position: relative;
          display: flex;
          justify-content: center;
          margin-top: 40px;
        }

        .take-phone {
          width: 280px;
          background: #1a1a1a;
          border-radius: 44px;
          padding: 12px;
          box-shadow:
            0 50px 100px -20px rgba(0, 0, 0, 0.2),
            0 30px 60px -30px rgba(0, 0, 0, 0.3);
          position: relative;
          z-index: 2;
        }

        @media (min-width: 768px) {
          .take-phone {
            width: 320px;
          }
        }

        .take-phone-notch {
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 28px;
          background: #1a1a1a;
          border-radius: 20px;
          z-index: 10;
        }

        .take-phone-screen {
          background: white;
          border-radius: 36px;
          overflow: hidden;
          aspect-ratio: 9/17;
        }

        .take-phone-header {
          background: var(--green-500);
          padding: 48px 16px 16px;
          color: white;
        }

        .take-phone-header-top {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .take-phone-avatar {
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .take-phone-store-name {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .take-phone-store-status {
          font-size: 12px;
          opacity: 0.9;
          margin: 2px 0 0;
        }

        .take-phone-body {
          padding: 16px;
          background: #f5f5f5;
        }

        .take-chat-bubble {
          background: white;
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 8px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .take-chat-bubble-green {
          background: #dcf8c6;
          margin-left: auto;
          max-width: 85%;
        }

        .take-chat-text {
          font-size: 13px;
          color: var(--gray-700);
          margin: 0;
          line-height: 1.4;
        }

        .take-order-card {
          background: white;
          border-radius: 12px;
          padding: 12px;
          margin-top: 8px;
          border: 1px solid var(--gray-200);
        }

        .take-order-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid var(--gray-100);
        }

        .take-order-item:last-child {
          border-bottom: none;
        }

        .take-order-img {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--green-100), var(--green-200));
        }

        .take-order-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--gray-800);
          margin: 0;
          flex: 1;
        }

        .take-order-price {
          font-size: 12px;
          font-weight: 600;
          color: var(--green-600);
        }

        .floating-badge {
          position: absolute;
          background: white;
          border-radius: 16px;
          padding: 12px 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 3;
        }

        .floating-badge-left {
          left: 0;
          top: 30%;
        }

        @media (min-width: 768px) {
          .floating-badge-left {
            left: 10%;
          }
        }

        @media (min-width: 1024px) {
          .floating-badge-left {
            left: 15%;
          }
        }

        .floating-badge-right {
          right: 0;
          top: 45%;
        }

        @media (min-width: 768px) {
          .floating-badge-right {
            right: 10%;
          }
        }

        @media (min-width: 1024px) {
          .floating-badge-right {
            right: 15%;
          }
        }

        .floating-badge-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .floating-badge-icon-green {
          background: var(--green-100);
          color: var(--green-600);
        }

        .floating-badge-icon-purple {
          background: #f3e8ff;
          color: #9333ea;
        }

        .floating-badge-text {
          font-size: 11px;
          color: var(--gray-500);
          margin: 0;
        }

        .floating-badge-value {
          font-size: 14px;
          font-weight: 700;
          color: var(--gray-900);
          margin: 2px 0 0;
        }

        /* Section Styles */
        .take-section {
          padding: 80px 0;
        }

        @media (min-width: 768px) {
          .take-section {
            padding: 100px 0;
          }
        }

        .take-section-white {
          background: white;
        }

        .take-section-gray {
          background: var(--gray-50);
        }

        .take-section-green {
          background: linear-gradient(180deg, var(--green-50) 0%, white 100%);
        }

        .take-section-header {
          text-align: center;
          max-width: 600px;
          margin: 0 auto 60px;
        }

        .take-section-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--green-600);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0 0 12px;
        }

        .take-section-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 32px;
          font-weight: 700;
          color: var(--gray-900);
          letter-spacing: -0.5px;
          margin: 0 0 16px;
          line-height: 1.2;
        }

        @media (min-width: 768px) {
          .take-section-title {
            font-size: 40px;
          }
        }

        .take-section-description {
          font-size: 17px;
          color: var(--gray-500);
          margin: 0;
          line-height: 1.6;
        }

        /* Features Grid */
        .take-features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        @media (min-width: 640px) {
          .take-features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .take-features-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .take-feature-card {
          background: white;
          border-radius: 20px;
          padding: 28px;
          border: 1px solid var(--gray-100);
          transition: all 0.3s ease;
        }

        .take-feature-card:hover {
          border-color: var(--green-200);
          box-shadow: 0 20px 40px rgba(34, 197, 94, 0.08);
          transform: translateY(-4px);
        }

        .take-feature-icon {
          width: 48px;
          height: 48px;
          background: var(--green-100);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--green-600);
          margin-bottom: 16px;
        }

        .take-feature-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--gray-900);
          margin: 0 0 8px;
        }

        .take-feature-text {
          font-size: 14px;
          color: var(--gray-500);
          line-height: 1.5;
          margin: 0;
        }

        /* WhatsApp API Section */
        .take-api-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
          align-items: center;
        }

        @media (min-width: 1024px) {
          .take-api-grid {
            grid-template-columns: 1fr 1fr;
            gap: 80px;
          }
        }

        .take-api-content h3 {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: var(--gray-900);
          margin: 0 0 16px;
        }

        @media (min-width: 768px) {
          .take-api-content h3 {
            font-size: 32px;
          }
        }

        .take-api-content p {
          font-size: 16px;
          color: var(--gray-500);
          line-height: 1.6;
          margin: 0 0 24px;
        }

        .take-api-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .take-api-list li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 0;
          font-size: 15px;
          color: var(--gray-700);
        }

        .take-api-list-icon {
          width: 24px;
          height: 24px;
          background: var(--green-100);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--green-600);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .take-api-visual {
          display: flex;
          justify-content: center;
        }

        .take-message-preview {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
          max-width: 360px;
          border: 1px solid var(--gray-100);
        }

        .take-message-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--gray-100);
        }

        .take-message-avatar {
          width: 44px;
          height: 44px;
          background: var(--green-500);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .take-message-from {
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-900);
          margin: 0;
        }

        .take-message-time {
          font-size: 12px;
          color: var(--gray-400);
          margin: 2px 0 0;
        }

        .take-message-body {
          font-size: 14px;
          color: var(--gray-600);
          line-height: 1.6;
        }

        .take-message-body strong {
          color: var(--gray-900);
        }

        /* Built for Local Business */
        .take-local-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        @media (min-width: 640px) {
          .take-local-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .take-local-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .take-local-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid var(--gray-100);
          transition: all 0.3s ease;
        }

        .take-local-card:hover {
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
        }

        .take-local-image {
          height: 180px;
          background: linear-gradient(135deg, var(--green-100), var(--green-50));
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .take-local-phone-mini {
          width: 100px;
          height: 180px;
          background: #1a1a1a;
          border-radius: 20px;
          padding: 8px;
          transform: translateY(20px);
        }

        .take-local-phone-screen {
          background: white;
          border-radius: 14px;
          height: 100%;
          overflow: hidden;
        }

        .take-local-phone-header {
          background: var(--green-500);
          height: 40px;
        }

        .take-local-content {
          padding: 20px;
        }

        .take-local-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--gray-900);
          margin: 0 0 8px;
        }

        .take-local-text {
          font-size: 14px;
          color: var(--gray-500);
          line-height: 1.5;
          margin: 0;
        }

        /* Website Builder Section */
        .take-website-preview {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          max-width: 900px;
          margin: 0 auto;
        }

        .take-website-toolbar {
          background: var(--gray-100);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .take-website-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--gray-300);
        }

        .take-website-dot:first-child {
          background: #ff5f57;
        }

        .take-website-dot:nth-child(2) {
          background: #febc2e;
        }

        .take-website-dot:nth-child(3) {
          background: #28c840;
        }

        .take-website-url {
          flex: 1;
          background: white;
          border-radius: 8px;
          padding: 8px 16px;
          margin-left: 16px;
          font-size: 13px;
          color: var(--gray-500);
        }

        .take-website-content {
          padding: 40px;
          background: linear-gradient(180deg, var(--green-50), white);
          min-height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .take-website-logo {
          width: 60px;
          height: 60px;
          background: var(--green-500);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-bottom: 16px;
        }

        .take-website-store-name {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: var(--gray-900);
          margin: 0 0 8px;
        }

        .take-website-store-desc {
          font-size: 14px;
          color: var(--gray-500);
          margin: 0 0 24px;
        }

        .take-website-grid {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .take-website-product {
          background: white;
          border-radius: 16px;
          padding: 16px;
          width: 140px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .take-website-product-img {
          width: 100%;
          height: 80px;
          background: linear-gradient(135deg, var(--green-100), var(--green-200));
          border-radius: 12px;
          margin-bottom: 12px;
        }

        .take-website-product-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--gray-900);
          margin: 0 0 4px;
        }

        .take-website-product-price {
          font-size: 13px;
          font-weight: 700;
          color: var(--green-600);
          margin: 0;
        }

        /* All-in-One Grid */
        .take-allinone-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        @media (min-width: 640px) {
          .take-allinone-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .take-allinone-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .take-allinone-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px;
          background: white;
          border-radius: 16px;
          border: 1px solid var(--gray-100);
        }

        .take-allinone-icon {
          width: 44px;
          height: 44px;
          background: var(--green-100);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--green-600);
          flex-shrink: 0;
        }

        .take-allinone-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--gray-900);
          margin: 0 0 4px;
        }

        .take-allinone-text {
          font-size: 13px;
          color: var(--gray-500);
          margin: 0;
        }

        /* Location Section */
        .take-location {
          text-align: center;
          padding: 60px 0;
          background: var(--green-50);
          border-radius: 24px;
          margin: 0 20px;
        }

        @media (min-width: 768px) {
          .take-location {
            margin: 0 40px;
          }
        }

        .take-location-flag {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .take-location-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: var(--gray-900);
          margin: 0 0 8px;
        }

        .take-location-text {
          font-size: 15px;
          color: var(--gray-500);
          margin: 0;
        }

        .take-location-badges {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-top: 20px;
        }

        .take-location-badge {
          background: white;
          padding: 8px 16px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 500;
          color: var(--gray-600);
          border: 1px solid var(--gray-200);
        }

        /* Testimonials */
        .take-testimonials-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        @media (min-width: 768px) {
          .take-testimonials-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .take-testimonial-card {
          background: white;
          border-radius: 20px;
          padding: 28px;
          border: 1px solid var(--gray-100);
        }

        .take-testimonial-stars {
          display: flex;
          gap: 4px;
          margin-bottom: 16px;
          color: #fbbf24;
        }

        .take-testimonial-text {
          font-size: 15px;
          color: var(--gray-600);
          line-height: 1.7;
          margin: 0 0 20px;
        }

        .take-testimonial-author {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .take-testimonial-avatar {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, var(--green-400), var(--green-500));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 16px;
        }

        .take-testimonial-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--gray-900);
          margin: 0;
        }

        .take-testimonial-role {
          font-size: 13px;
          color: var(--gray-500);
          margin: 2px 0 0;
        }

        /* Pricing Section */
        .take-pricing-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          max-width: 900px;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .take-pricing-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .take-pricing-card {
          background: white;
          border-radius: 24px;
          padding: 32px;
          border: 2px solid var(--gray-100);
          transition: all 0.3s ease;
        }

        .take-pricing-card:hover {
          border-color: var(--green-200);
        }

        .take-pricing-card-popular {
          border-color: var(--green-500);
          position: relative;
        }

        .take-pricing-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--green-500);
          color: white;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 16px;
          border-radius: 100px;
        }

        .take-pricing-name {
          font-size: 18px;
          font-weight: 600;
          color: var(--gray-900);
          margin: 0 0 8px;
        }

        .take-pricing-desc {
          font-size: 14px;
          color: var(--gray-500);
          margin: 0 0 20px;
        }

        .take-pricing-price {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 48px;
          font-weight: 700;
          color: var(--gray-900);
          margin: 0;
        }

        .take-pricing-price span {
          font-size: 16px;
          font-weight: 500;
          color: var(--gray-500);
        }

        .take-pricing-features {
          list-style: none;
          padding: 0;
          margin: 24px 0;
        }

        .take-pricing-features li {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 0;
          font-size: 14px;
          color: var(--gray-600);
        }

        .take-pricing-features li svg {
          color: var(--green-500);
          flex-shrink: 0;
        }

        .take-pricing-btn {
          width: 100%;
          justify-content: center;
        }

        /* FAQ Section */
        .take-faq-list {
          max-width: 700px;
          margin: 0 auto;
        }

        .take-faq-item {
          background: white;
          border-radius: 16px;
          margin-bottom: 12px;
          border: 1px solid var(--gray-100);
          overflow: hidden;
        }

        .take-faq-question {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          font-size: 16px;
          font-weight: 600;
          color: var(--gray-900);
          cursor: pointer;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
        }

        .take-faq-question:hover {
          background: var(--gray-50);
        }

        .take-faq-answer {
          padding: 0 24px 20px;
          font-size: 15px;
          color: var(--gray-600);
          line-height: 1.6;
        }

        /* CTA Section */
        .take-cta {
          background: var(--green-500);
          padding: 80px 0;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .take-cta-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }

        .take-cta-content {
          position: relative;
          z-index: 1;
        }

        .take-cta-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 32px;
          font-weight: 700;
          color: white;
          margin: 0 0 12px;
        }

        @media (min-width: 768px) {
          .take-cta-title {
            font-size: 40px;
          }
        }

        .take-cta-subtitle {
          font-size: 17px;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 32px;
        }

        .take-cta-btn {
          background: white;
          color: var(--green-600);
          font-size: 15px;
          font-weight: 600;
          padding: 16px 32px;
          border-radius: 100px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          transition: all 0.2s;
        }

        .take-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        /* Footer */
        .take-footer {
          background: var(--gray-900);
          padding: 60px 0 40px;
          color: white;
        }

        .take-footer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
          margin-bottom: 48px;
        }

        @media (min-width: 768px) {
          .take-footer-grid {
            grid-template-columns: 2fr 1fr 1fr 1fr;
          }
        }

        .take-footer-brand p {
          font-size: 14px;
          color: var(--gray-400);
          line-height: 1.6;
          margin: 16px 0 0;
          max-width: 280px;
        }

        .take-footer-title {
          font-size: 14px;
          font-weight: 600;
          color: white;
          margin: 0 0 16px;
        }

        .take-footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .take-footer-links li {
          margin-bottom: 10px;
        }

        .take-footer-links a {
          font-size: 14px;
          color: var(--gray-400);
          text-decoration: none;
          transition: color 0.2s;
        }

        .take-footer-links a:hover {
          color: white;
        }

        .take-footer-bottom {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding-top: 32px;
          border-top: 1px solid var(--gray-700);
        }

        @media (min-width: 768px) {
          .take-footer-bottom {
            flex-direction: row;
            justify-content: space-between;
          }
        }

        .take-footer-copyright {
          font-size: 14px;
          color: var(--gray-500);
          margin: 0;
        }

        .take-footer-tagline {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--gray-400);
        }

        .take-footer-tagline svg {
          color: var(--green-500);
        }
      `}</style>

      <div className="take-landing">
        {/* Navigation */}
        <header className={`take-nav ${scrolled ? "scrolled" : ""}`}>
          <div className="take-container">
            <nav className="take-nav-inner">
              <Link href="/" className="take-logo">
                <div className="take-logo-icon">
                  <MessageCircle size={20} />
                </div>
                <span className="take-logo-text">Take</span>
              </Link>

              <div className="take-nav-links">
                <Link href="#features" className="take-nav-link">Features</Link>
                <Link href="#pricing" className="take-nav-link">Pricing</Link>
                <Link href="#faq" className="take-nav-link">FAQ</Link>
              </div>

              <div className="take-nav-actions">
                <Link href="/login" className="take-btn take-btn-ghost">Sign in</Link>
                <Link href="/register" className="take-btn take-btn-primary">
                  Get Started
                </Link>
              </div>

              <button
                className="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </nav>
          </div>

          {mobileMenuOpen && (
            <div className="mobile-menu">
              <Link href="#features" onClick={() => setMobileMenuOpen(false)}>Features</Link>
              <Link href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
              <Link href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</Link>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
              <Link href="/register" className="take-btn take-btn-primary" onClick={() => setMobileMenuOpen(false)}>
                Get Started
              </Link>
            </div>
          )}
        </header>

        {/* Hero Section */}
        <section className="take-hero">
          <div className="take-container">
            <div className="take-hero-badge">
              <Sparkles size={16} className="take-hero-badge-icon" />
              Commission-free ecommerce
            </div>

            <h1 className="take-hero-title">
              Create Ecommerce for WhatsApp
            </h1>

            <p className="take-hero-subtitle">
              Build your online store, accept orders via WhatsApp, and grow your business without any commission fees. Perfect for local businesses.
            </p>

            <div className="take-hero-buttons">
              <Link href="/register" className="take-btn take-btn-primary take-btn-large">
                Get Started Free
                <ArrowRight size={18} />
              </Link>
              <Link href="#features" className="take-btn take-btn-secondary take-btn-large">
                How it Works
              </Link>
            </div>

            <div className="take-phone-container">
              <div className="floating-badge floating-badge-left" style={{ display: 'none' }}>
                <div className="floating-badge-icon floating-badge-icon-green">
                  <Bell size={20} />
                </div>
                <div>
                  <p className="floating-badge-text">New order</p>
                  <p className="floating-badge-value">+$45.00</p>
                </div>
              </div>

              <div className="take-phone">
                <div className="take-phone-notch" />
                <div className="take-phone-screen">
                  <div className="take-phone-header">
                    <div className="take-phone-header-top">
                      <div className="take-phone-avatar">
                        <Store size={22} />
                      </div>
                      <div>
                        <p className="take-phone-store-name">Fresh Market</p>
                        <p className="take-phone-store-status">Online</p>
                      </div>
                    </div>
                  </div>
                  <div className="take-phone-body">
                    <div className="take-chat-bubble">
                      <p className="take-chat-text">Hi! I'd like to place an order please</p>
                    </div>
                    <div className="take-chat-bubble take-chat-bubble-green">
                      <p className="take-chat-text">Of course! Here's your order:</p>
                    </div>
                    <div className="take-order-card">
                      <div className="take-order-item">
                        <div className="take-order-img" />
                        <p className="take-order-name">Organic Avocados</p>
                        <p className="take-order-price">$6.99</p>
                      </div>
                      <div className="take-order-item">
                        <div className="take-order-img" />
                        <p className="take-order-name">Fresh Bread</p>
                        <p className="take-order-price">$4.50</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="floating-badge floating-badge-right" style={{ display: 'none' }}>
                <div className="floating-badge-icon floating-badge-icon-purple">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <p className="floating-badge-text">This month</p>
                  <p className="floating-badge-value">$2,450</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Simplify WhatsApp Ordering */}
        <section id="features" className="take-section take-section-white">
          <div className="take-container">
            <div className="take-section-header">
              <p className="take-section-label">Features</p>
              <h2 className="take-section-title">Simplify WhatsApp Ordering</h2>
              <p className="take-section-description">
                Everything you need to run your business on WhatsApp. No technical skills required.
              </p>
            </div>

            <div className="take-features-grid">
              <FeatureCard
                icon={<MessageCircle size={24} />}
                title="WhatsApp Order Form"
                description="Customers order directly through WhatsApp with a beautiful order form."
              />
              <FeatureCard
                icon={<Package size={24} />}
                title="Order Management"
                description="Track and manage all your orders from one simple dashboard."
              />
              <FeatureCard
                icon={<CreditCard size={24} />}
                title="Local Payments"
                description="Accept cash, bank transfer, and popular local payment methods."
              />
              <FeatureCard
                icon={<ShoppingCart size={24} />}
                title="Flexible Ordering"
                description="Works for restaurants, retail, groceries, and any business type."
              />
            </div>
          </div>
        </section>

        {/* WhatsApp Business API */}
        <section className="take-section take-section-gray">
          <div className="take-container">
            <div className="take-api-grid">
              <div className="take-api-content">
                <p className="take-section-label">WhatsApp Business API</p>
                <h3>Automate Your Customer Communication</h3>
                <p>
                  Send automated messages, order confirmations, and promotional broadcasts to keep your customers engaged.
                </p>
                <ul className="take-api-list">
                  <li>
                    <span className="take-api-list-icon"><Check size={14} /></span>
                    Send broadcast messages to all customers
                  </li>
                  <li>
                    <span className="take-api-list-icon"><Check size={14} /></span>
                    Automatic order confirmation messages
                  </li>
                  <li>
                    <span className="take-api-list-icon"><Check size={14} /></span>
                    Thank you messages after purchase
                  </li>
                  <li>
                    <span className="take-api-list-icon"><Check size={14} /></span>
                    Product catalog in WhatsApp
                  </li>
                </ul>
              </div>
              <div className="take-api-visual">
                <div className="take-message-preview">
                  <div className="take-message-header">
                    <div className="take-message-avatar">
                      <MessageCircle size={22} />
                    </div>
                    <div>
                      <p className="take-message-from">Fresh Market</p>
                      <p className="take-message-time">Just now</p>
                    </div>
                  </div>
                  <div className="take-message-body">
                    <p><strong>Order Confirmed!</strong></p>
                    <p style={{ marginTop: '12px' }}>
                      Thank you for your order! Your items will be ready for pickup in 30 minutes.
                    </p>
                    <p style={{ marginTop: '12px' }}>
                      Order #1234<br />
                      Total: $24.99
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Built for Local Business */}
        <section className="take-section take-section-white">
          <div className="take-container">
            <div className="take-section-header">
              <p className="take-section-label">For Local Business</p>
              <h2 className="take-section-title">Built for Every Local Business</h2>
              <p className="take-section-description">
                Whether you're a restaurant, grocery store, or boutique — Take helps you sell online effortlessly.
              </p>
            </div>

            <div className="take-local-grid">
              <LocalBusinessCard
                title="Restaurants & Cafes"
                description="Digital menus with ordering and delivery management."
              />
              <LocalBusinessCard
                title="Grocery Stores"
                description="List products and accept orders with easy inventory."
              />
              <LocalBusinessCard
                title="Retail & Boutiques"
                description="Showcase products with beautiful catalogs."
              />
            </div>
          </div>
        </section>

        {/* Create Your Website */}
        <section className="take-section take-section-green">
          <div className="take-container">
            <div className="take-section-header">
              <p className="take-section-label">Website Builder</p>
              <h2 className="take-section-title">Create Your Website in Minutes</h2>
              <p className="take-section-description">
                No coding required. Build a beautiful storefront that works on any device.
              </p>
            </div>

            <div className="take-website-preview">
              <div className="take-website-toolbar">
                <div className="take-website-dot" />
                <div className="take-website-dot" />
                <div className="take-website-dot" />
                <div className="take-website-url">take.app/fresh-market</div>
              </div>
              <div className="take-website-content">
                <div className="take-website-logo">
                  <Store size={28} />
                </div>
                <h3 className="take-website-store-name">Fresh Market</h3>
                <p className="take-website-store-desc">Fresh groceries delivered to your door</p>
                <div className="take-website-grid">
                  <div className="take-website-product">
                    <div className="take-website-product-img" />
                    <p className="take-website-product-name">Avocados</p>
                    <p className="take-website-product-price">$6.99</p>
                  </div>
                  <div className="take-website-product">
                    <div className="take-website-product-img" />
                    <p className="take-website-product-name">Organic Eggs</p>
                    <p className="take-website-product-price">$5.49</p>
                  </div>
                  <div className="take-website-product">
                    <div className="take-website-product-img" />
                    <p className="take-website-product-name">Fresh Bread</p>
                    <p className="take-website-product-price">$4.50</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* All-in-One Business Software */}
        <section className="take-section take-section-white">
          <div className="take-container">
            <div className="take-section-header">
              <p className="take-section-label">All-in-One</p>
              <h2 className="take-section-title">All-in-One Business Software</h2>
              <p className="take-section-description">
                Everything you need to manage and grow your business in one place.
              </p>
            </div>

            <div className="take-allinone-grid">
              <AllInOneItem icon={<Store size={22} />} title="Online Store" text="Beautiful storefront" />
              <AllInOneItem icon={<MessageCircle size={22} />} title="WhatsApp Integration" text="Direct ordering" />
              <AllInOneItem icon={<Package size={22} />} title="Order Management" text="Track all orders" />
              <AllInOneItem icon={<Users size={22} />} title="Customer Database" text="Build relationships" />
              <AllInOneItem icon={<BarChart3 size={22} />} title="Analytics" text="Insights & reports" />
              <AllInOneItem icon={<CreditCard size={22} />} title="Payments" text="Multiple methods" />
              <AllInOneItem icon={<Globe size={22} />} title="Custom Domain" text="Your own URL" />
              <AllInOneItem icon={<Bell size={22} />} title="Notifications" text="Real-time alerts" />
              <AllInOneItem icon={<Shield size={22} />} title="Secure" text="Data protection" />
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="take-section">
          <div className="take-location">
            <div className="take-location-flag">🇩🇿</div>
            <h3 className="take-location-title">Available in Algeria</h3>
            <p className="take-location-text">Supporting local businesses across the country</p>
            <div className="take-location-badges">
              <span className="take-location-badge">CCP Payments</span>
              <span className="take-location-badge">Cash on Delivery</span>
              <span className="take-location-badge">Arabic Support</span>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="take-section take-section-white">
          <div className="take-container">
            <div className="take-section-header">
              <p className="take-section-label">Testimonials</p>
              <h2 className="take-section-title">What Customers are Saying</h2>
            </div>

            <div className="take-testimonials-grid">
              <TestimonialCard
                text="Take helped us go digital in just one day. Our orders have tripled since we started using WhatsApp ordering."
                name="Ahmed B."
                role="Restaurant Owner"
                initials="AB"
              />
              <TestimonialCard
                text="The easiest platform I've ever used. My customers love ordering on WhatsApp - it's so convenient for them."
                name="Fatima K."
                role="Boutique Owner"
                initials="FK"
              />
              <TestimonialCard
                text="No more phone calls! Everything is organized and I can focus on making great food instead of taking orders."
                name="Youssef M."
                role="Cafe Owner"
                initials="YM"
              />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="take-section take-section-gray">
          <div className="take-container">
            <div className="take-section-header">
              <p className="take-section-label">Pricing</p>
              <h2 className="take-section-title">Simple, Transparent Pricing</h2>
              <p className="take-section-description">
                No hidden fees. No commission on sales. Just a simple monthly subscription.
              </p>
            </div>

            <div className="take-pricing-grid">
              <div className="take-pricing-card">
                <h3 className="take-pricing-name">Free</h3>
                <p className="take-pricing-desc">Perfect for getting started</p>
                <p className="take-pricing-price">$0 <span>/month</span></p>
                <ul className="take-pricing-features">
                  <li><Check size={18} /> Up to 20 products</li>
                  <li><Check size={18} /> WhatsApp ordering</li>
                  <li><Check size={18} /> Basic analytics</li>
                  <li><Check size={18} /> take.app subdomain</li>
                </ul>
                <Link href="/register" className="take-btn take-btn-secondary take-pricing-btn">
                  Start Free
                </Link>
              </div>

              <div className="take-pricing-card take-pricing-card-popular">
                <span className="take-pricing-badge">Most Popular</span>
                <h3 className="take-pricing-name">Pro</h3>
                <p className="take-pricing-desc">For growing businesses</p>
                <p className="take-pricing-price">$19 <span>/month</span></p>
                <ul className="take-pricing-features">
                  <li><Check size={18} /> Unlimited products</li>
                  <li><Check size={18} /> WhatsApp Business API</li>
                  <li><Check size={18} /> Advanced analytics</li>
                  <li><Check size={18} /> Custom domain</li>
                  <li><Check size={18} /> Priority support</li>
                </ul>
                <Link href="/register" className="take-btn take-btn-primary take-pricing-btn">
                  Get Started
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="take-section take-section-white">
          <div className="take-container">
            <div className="take-section-header">
              <p className="take-section-label">FAQ</p>
              <h2 className="take-section-title">Frequently Asked Questions</h2>
            </div>

            <div className="take-faq-list">
              <FAQItem
                question="How does WhatsApp ordering work?"
                answer="Customers browse your online store and add items to their cart. When they checkout, their order is automatically sent to your WhatsApp as a formatted message. You can then confirm the order and arrange payment/delivery."
                isOpen={openFaq === 0}
                onClick={() => setOpenFaq(openFaq === 0 ? null : 0)}
              />
              <FAQItem
                question="Do I need any technical skills?"
                answer="No! Take is designed to be incredibly easy to use. If you can use WhatsApp, you can use Take. Just add your products, set prices, and start selling. We handle all the technical stuff."
                isOpen={openFaq === 1}
                onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
              />
              <FAQItem
                question="What payment methods are supported?"
                answer="We support cash on delivery, bank transfers, CCP (for Algeria), and you can add any custom payment instructions. We're always adding new payment options."
                isOpen={openFaq === 2}
                onClick={() => setOpenFaq(openFaq === 2 ? null : 2)}
              />
              <FAQItem
                question="Is there a transaction fee?"
                answer="No! Unlike other platforms, we don't charge any commission on your sales. You keep 100% of what you earn. We only charge a simple monthly subscription for premium features."
                isOpen={openFaq === 3}
                onClick={() => setOpenFaq(openFaq === 3 ? null : 3)}
              />
              <FAQItem
                question="Can I use my own domain?"
                answer="Yes! Pro plan users can connect their own custom domain (like shop.yourbusiness.com) to their Take store for a more professional look."
                isOpen={openFaq === 4}
                onClick={() => setOpenFaq(openFaq === 4 ? null : 4)}
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="take-cta">
          <div className="take-cta-bg" />
          <div className="take-container">
            <div className="take-cta-content">
              <h2 className="take-cta-title">
                WhatsApp-first and<br />Commission-free Ecommerce
              </h2>
              <p className="take-cta-subtitle">
                Join thousands of businesses selling on WhatsApp. Start for free today.
              </p>
              <Link href="/register" className="take-cta-btn">
                Get Started Free
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="take-footer">
          <div className="take-container">
            <div className="take-footer-grid">
              <div className="take-footer-brand">
                <Link href="/" className="take-logo">
                  <div className="take-logo-icon">
                    <MessageCircle size={20} />
                  </div>
                  <span className="take-logo-text" style={{ color: 'white' }}>Take</span>
                </Link>
                <p>The easiest way to sell on WhatsApp. No commission, no complexity, just sales.</p>
              </div>

              <div>
                <h4 className="take-footer-title">Product</h4>
                <ul className="take-footer-links">
                  <li><Link href="#features">Features</Link></li>
                  <li><Link href="#pricing">Pricing</Link></li>
                  <li><Link href="#faq">FAQ</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="take-footer-title">Company</h4>
                <ul className="take-footer-links">
                  <li><Link href="/about">About</Link></li>
                  <li><Link href="/blog">Blog</Link></li>
                  <li><Link href="/contact">Contact</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="take-footer-title">Legal</h4>
                <ul className="take-footer-links">
                  <li><Link href="/privacy">Privacy Policy</Link></li>
                  <li><Link href="/terms">Terms of Service</Link></li>
                </ul>
              </div>
            </div>

            <div className="take-footer-bottom">
              <p className="take-footer-copyright">
                © {new Date().getFullYear()} Take. All rights reserved.
              </p>
              <div className="take-footer-tagline">
                <MessageCircle size={16} />
                WhatsApp-first ecommerce
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="take-feature-card">
      <div className="take-feature-icon">{icon}</div>
      <h3 className="take-feature-title">{title}</h3>
      <p className="take-feature-text">{description}</p>
    </div>
  );
}

function LocalBusinessCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="take-local-card">
      <div className="take-local-image">
        <div className="take-local-phone-mini">
          <div className="take-local-phone-screen">
            <div className="take-local-phone-header" />
          </div>
        </div>
      </div>
      <div className="take-local-content">
        <h4 className="take-local-title">{title}</h4>
        <p className="take-local-text">{description}</p>
      </div>
    </div>
  );
}

function AllInOneItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="take-allinone-item">
      <div className="take-allinone-icon">{icon}</div>
      <div>
        <h4 className="take-allinone-title">{title}</h4>
        <p className="take-allinone-text">{text}</p>
      </div>
    </div>
  );
}

function TestimonialCard({ text, name, role, initials }: { text: string; name: string; role: string; initials: string }) {
  return (
    <div className="take-testimonial-card">
      <div className="take-testimonial-stars">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={16} fill="currentColor" />
        ))}
      </div>
      <p className="take-testimonial-text">"{text}"</p>
      <div className="take-testimonial-author">
        <div className="take-testimonial-avatar">{initials}</div>
        <div>
          <p className="take-testimonial-name">{name}</p>
          <p className="take-testimonial-role">{role}</p>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="take-faq-item">
      <button className="take-faq-question" onClick={onClick}>
        {question}
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isOpen && <p className="take-faq-answer">{answer}</p>}
    </div>
  );
}
