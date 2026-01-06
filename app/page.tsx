"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Utensils,
  MessageCircle,
  BarChart3,
  Share2,
  ArrowRight,
  Menu,
  X,
  Check,
  Smartphone,
  MousePointer,
  Send,
} from "lucide-react";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        :root {
          --green: #22c55e;
          --green-dark: #16a34a;
          --green-light: #dcfce7;
          --green-50: #f0fdf4;
          --dark: #0f172a;
          --dark-light: #1e293b;
          --gray: #64748b;
          --gray-light: #94a3b8;
          --gray-100: #f1f5f9;
          --white: #ffffff;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        .hak-landing {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--white);
          min-height: 100vh;
          overflow-x: hidden;
          color: var(--dark);
        }

        .hak-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Navigation */
        .hak-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 20px 0;
        }

        .hak-nav.scrolled {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          box-shadow: 0 1px 0 rgba(0, 0, 0, 0.05);
          padding: 16px 0;
        }

        .hak-nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .hak-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .hak-logo-mark {
          width: 40px;
          height: 40px;
          background: var(--green);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .hak-logo-text {
          font-size: 24px;
          font-weight: 800;
          color: var(--dark);
          letter-spacing: -0.5px;
        }

        .hak-nav-actions {
          display: none;
          align-items: center;
          gap: 16px;
        }

        @media (min-width: 768px) {
          .hak-nav-actions {
            display: flex;
          }
        }

        .hak-btn {
          font-family: inherit;
          font-size: 15px;
          font-weight: 600;
          border-radius: 12px;
          padding: 12px 24px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
        }

        .hak-btn-ghost {
          background: transparent;
          color: var(--gray);
        }

        .hak-btn-ghost:hover {
          color: var(--dark);
        }

        .hak-btn-primary {
          background: var(--green);
          color: white;
          box-shadow: 0 4px 14px rgba(34, 197, 94, 0.25);
        }

        .hak-btn-primary:hover {
          background: var(--green-dark);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(34, 197, 94, 0.35);
        }

        .hak-btn-dark {
          background: var(--dark);
          color: white;
        }

        .hak-btn-dark:hover {
          background: var(--dark-light);
        }

        .hak-btn-large {
          padding: 16px 32px;
          font-size: 16px;
          border-radius: 14px;
        }

        .mobile-toggle {
          display: flex;
          padding: 8px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--dark);
        }

        @media (min-width: 768px) {
          .mobile-toggle {
            display: none;
          }
        }

        .mobile-menu {
          position: fixed;
          top: 80px;
          left: 0;
          right: 0;
          background: white;
          border-bottom: 1px solid var(--gray-100);
          padding: 24px;
          z-index: 99;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mobile-menu .hak-btn {
          width: 100%;
          justify-content: center;
        }

        /* Hero Section */
        .hak-hero {
          padding: 160px 0 100px;
          position: relative;
          overflow: hidden;
        }

        @media (min-width: 768px) {
          .hak-hero {
            padding: 180px 0 120px;
          }
        }

        .hak-hero-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            radial-gradient(circle at 70% 20%, rgba(34, 197, 94, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 30% 80%, rgba(34, 197, 94, 0.05) 0%, transparent 40%);
          pointer-events: none;
        }

        .hak-hero-content {
          position: relative;
          z-index: 1;
          max-width: 800px;
        }

        .hak-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--green-50);
          color: var(--green-dark);
          font-size: 14px;
          font-weight: 600;
          padding: 10px 18px;
          border-radius: 100px;
          margin-bottom: 32px;
          border: 1px solid var(--green-light);
        }

        .hak-hero-title {
          font-size: 48px;
          font-weight: 800;
          color: var(--dark);
          line-height: 1.1;
          letter-spacing: -2px;
          margin-bottom: 24px;
        }

        @media (min-width: 768px) {
          .hak-hero-title {
            font-size: 64px;
            letter-spacing: -3px;
          }
        }

        @media (min-width: 1024px) {
          .hak-hero-title {
            font-size: 76px;
          }
        }

        .hak-hero-title span {
          color: var(--green);
        }

        .hak-hero-subtitle {
          font-size: 18px;
          color: var(--gray);
          line-height: 1.7;
          margin-bottom: 40px;
          max-width: 540px;
        }

        @media (min-width: 768px) {
          .hak-hero-subtitle {
            font-size: 20px;
          }
        }

        .hak-hero-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 60px;
        }

        .hak-hero-stats {
          display: flex;
          gap: 48px;
          flex-wrap: wrap;
        }

        .hak-stat {
          display: flex;
          flex-direction: column;
        }

        .hak-stat-value {
          font-size: 32px;
          font-weight: 800;
          color: var(--dark);
          letter-spacing: -1px;
        }

        .hak-stat-label {
          font-size: 14px;
          color: var(--gray);
          margin-top: 4px;
        }

        /* Features Section */
        .hak-features {
          padding: 100px 0;
          background: var(--gray-100);
        }

        .hak-section-header {
          text-align: center;
          margin-bottom: 64px;
        }

        .hak-section-label {
          font-size: 14px;
          font-weight: 700;
          color: var(--green);
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 16px;
        }

        .hak-section-title {
          font-size: 36px;
          font-weight: 800;
          color: var(--dark);
          letter-spacing: -1px;
          margin-bottom: 16px;
        }

        @media (min-width: 768px) {
          .hak-section-title {
            font-size: 48px;
            letter-spacing: -2px;
          }
        }

        .hak-section-desc {
          font-size: 18px;
          color: var(--gray);
          max-width: 500px;
          margin: 0 auto;
        }

        .hak-features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        @media (min-width: 768px) {
          .hak-features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .hak-features-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .hak-feature-card {
          background: white;
          border-radius: 24px;
          padding: 32px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
        }

        .hak-feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          border-color: var(--green-light);
        }

        .hak-feature-icon {
          width: 56px;
          height: 56px;
          background: var(--green-50);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--green);
          margin-bottom: 24px;
        }

        .hak-feature-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--dark);
          margin-bottom: 12px;
        }

        .hak-feature-text {
          font-size: 15px;
          color: var(--gray);
          line-height: 1.6;
        }

        /* How It Works */
        .hak-how {
          padding: 100px 0;
          background: white;
        }

        .hak-how-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
        }

        @media (min-width: 768px) {
          .hak-how-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 32px;
          }
        }

        .hak-how-step {
          text-align: center;
          position: relative;
        }

        .hak-how-number {
          width: 64px;
          height: 64px;
          background: var(--green);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 800;
          color: white;
          margin: 0 auto 24px;
        }

        .hak-how-icon {
          width: 80px;
          height: 80px;
          background: var(--gray-100);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--dark);
          margin: 0 auto 24px;
        }

        .hak-how-title {
          font-size: 22px;
          font-weight: 700;
          color: var(--dark);
          margin-bottom: 12px;
        }

        .hak-how-text {
          font-size: 16px;
          color: var(--gray);
          line-height: 1.6;
          max-width: 280px;
          margin: 0 auto;
        }

        /* CTA Section */
        .hak-cta {
          padding: 100px 0;
          background: var(--dark);
          position: relative;
          overflow: hidden;
        }

        .hak-cta-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            radial-gradient(circle at 20% 50%, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(34, 197, 94, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }

        .hak-cta-content {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }

        .hak-cta-title {
          font-size: 40px;
          font-weight: 800;
          color: white;
          letter-spacing: -1.5px;
          margin-bottom: 20px;
          line-height: 1.2;
        }

        @media (min-width: 768px) {
          .hak-cta-title {
            font-size: 52px;
            letter-spacing: -2px;
          }
        }

        .hak-cta-subtitle {
          font-size: 18px;
          color: var(--gray-light);
          margin-bottom: 40px;
          line-height: 1.6;
        }

        .hak-cta-btn {
          background: var(--green);
          color: white;
          font-size: 17px;
          font-weight: 700;
          padding: 18px 40px;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
        }

        .hak-cta-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 30px rgba(34, 197, 94, 0.5);
        }

        /* Footer */
        .hak-footer {
          padding: 60px 0 40px;
          background: var(--dark);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .hak-footer-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 24px;
        }

        @media (min-width: 768px) {
          .hak-footer-inner {
            flex-direction: row;
            justify-content: space-between;
            text-align: left;
          }
        }

        .hak-footer-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hak-footer-logo {
          width: 36px;
          height: 36px;
          background: var(--green);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .hak-footer-name {
          font-size: 20px;
          font-weight: 800;
          color: white;
        }

        .hak-footer-copy {
          font-size: 14px;
          color: var(--gray);
        }

        .hak-footer-links {
          display: flex;
          gap: 32px;
        }

        .hak-footer-link {
          font-size: 14px;
          color: var(--gray);
          text-decoration: none;
          transition: color 0.2s;
        }

        .hak-footer-link:hover {
          color: white;
        }
      `}</style>

      <div className="hak-landing">
        {/* Navigation */}
        <header className={`hak-nav ${scrolled ? "scrolled" : ""}`}>
          <div className="hak-container">
            <nav className="hak-nav-inner">
              <Link href="/" className="hak-logo">
                <div className="hak-logo-mark">
                  <Utensils size={22} />
                </div>
                <span className="hak-logo-text">HakMenu</span>
              </Link>

              <div className="hak-nav-actions">
                <Link href="/login" className="hak-btn hak-btn-ghost">Se connecter</Link>
                <Link href="/register" className="hak-btn hak-btn-primary">
                  Commencer gratuitement
                </Link>
              </div>

              <button
                className="mobile-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </nav>
          </div>

          {mobileMenuOpen && (
            <div className="mobile-menu">
              <Link href="/login" className="hak-btn hak-btn-ghost" onClick={() => setMobileMenuOpen(false)}>
                Se connecter
              </Link>
              <Link href="/register" className="hak-btn hak-btn-primary" onClick={() => setMobileMenuOpen(false)}>
                Commencer gratuitement
              </Link>
            </div>
          )}
        </header>

        {/* Hero Section */}
        <section className="hak-hero">
          <div className="hak-hero-bg" />
          <div className="hak-container">
            <div className="hak-hero-content">
              <div className="hak-hero-badge">
                <Check size={16} />
                100% Gratuit • Sans commission
              </div>

              <h1 className="hak-hero-title">
                Votre menu digital en <span>quelques minutes</span>
              </h1>

              <p className="hak-hero-subtitle">
                Créez votre menu en ligne, recevez des commandes via WhatsApp et
                développez votre restaurant. Simple, rapide et gratuit.
              </p>

              <div className="hak-hero-buttons">
                <Link href="/register" className="hak-btn hak-btn-primary hak-btn-large">
                  Créer mon menu
                  <ArrowRight size={20} />
                </Link>
                <Link href="#features" className="hak-btn hak-btn-dark hak-btn-large">
                  Découvrir
                </Link>
              </div>

              <div className="hak-hero-stats">
                <div className="hak-stat">
                  <span className="hak-stat-value">500+</span>
                  <span className="hak-stat-label">Restaurants</span>
                </div>
                <div className="hak-stat">
                  <span className="hak-stat-value">10K+</span>
                  <span className="hak-stat-label">Commandes</span>
                </div>
                <div className="hak-stat">
                  <span className="hak-stat-value">0%</span>
                  <span className="hak-stat-label">Commission</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="hak-features">
          <div className="hak-container">
            <div className="hak-section-header">
              <p className="hak-section-label">Fonctionnalités</p>
              <h2 className="hak-section-title">Tout ce dont vous avez besoin</h2>
              <p className="hak-section-desc">
                Des outils puissants pour gérer votre restaurant en ligne
              </p>
            </div>

            <div className="hak-features-grid">
              <div className="hak-feature-card">
                <div className="hak-feature-icon">
                  <Utensils size={28} />
                </div>
                <h3 className="hak-feature-title">Menu Digital</h3>
                <p className="hak-feature-text">
                  Créez un menu élégant avec photos, descriptions et prix.
                  Modifiable à tout moment.
                </p>
              </div>

              <div className="hak-feature-card">
                <div className="hak-feature-icon">
                  <MessageCircle size={28} />
                </div>
                <h3 className="hak-feature-title">Commandes WhatsApp</h3>
                <p className="hak-feature-text">
                  Recevez les commandes directement sur WhatsApp.
                  Vos clients commandent facilement.
                </p>
              </div>

              <div className="hak-feature-card">
                <div className="hak-feature-icon">
                  <BarChart3 size={28} />
                </div>
                <h3 className="hak-feature-title">Tableau de Bord</h3>
                <p className="hak-feature-text">
                  Suivez vos vues, commandes et revenus.
                  Analysez les performances de votre menu.
                </p>
              </div>

              <div className="hak-feature-card">
                <div className="hak-feature-icon">
                  <Share2 size={28} />
                </div>
                <h3 className="hak-feature-title">Liens Marketing</h3>
                <p className="hak-feature-text">
                  Partagez sur Instagram, TikTok et Facebook.
                  Trackez d'où viennent vos clients.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="hak-how">
          <div className="hak-container">
            <div className="hak-section-header">
              <p className="hak-section-label">Comment ça marche</p>
              <h2 className="hak-section-title">3 étapes simples</h2>
              <p className="hak-section-desc">
                Lancez votre menu digital en moins de 10 minutes
              </p>
            </div>

            <div className="hak-how-grid">
              <div className="hak-how-step">
                <div className="hak-how-icon">
                  <MousePointer size={36} />
                </div>
                <h3 className="hak-how-title">1. Créez votre compte</h3>
                <p className="hak-how-text">
                  Inscrivez-vous gratuitement et configurez votre restaurant en quelques clics
                </p>
              </div>

              <div className="hak-how-step">
                <div className="hak-how-icon">
                  <Smartphone size={36} />
                </div>
                <h3 className="hak-how-title">2. Ajoutez vos plats</h3>
                <p className="hak-how-text">
                  Créez vos catégories, ajoutez vos plats avec photos et prix
                </p>
              </div>

              <div className="hak-how-step">
                <div className="hak-how-icon">
                  <Send size={36} />
                </div>
                <h3 className="hak-how-title">3. Partagez votre lien</h3>
                <p className="hak-how-text">
                  Partagez votre menu et commencez à recevoir des commandes
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="hak-cta">
          <div className="hak-cta-bg" />
          <div className="hak-container">
            <div className="hak-cta-content">
              <h2 className="hak-cta-title">
                Prêt à digitaliser votre restaurant?
              </h2>
              <p className="hak-cta-subtitle">
                Rejoignez des centaines de restaurants algériens qui utilisent
                HakMenu pour développer leur activité.
              </p>
              <Link href="/register" className="hak-cta-btn">
                Commencer gratuitement
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="hak-footer">
          <div className="hak-container">
            <div className="hak-footer-inner">
              <div className="hak-footer-brand">
                <div className="hak-footer-logo">
                  <Utensils size={18} />
                </div>
                <span className="hak-footer-name">HakMenu</span>
              </div>

              <p className="hak-footer-copy">
                © {new Date().getFullYear()} HakMenu. Fait avec ❤️ en Algérie
              </p>

              <div className="hak-footer-links">
                <Link href="/login" className="hak-footer-link">Connexion</Link>
                <Link href="/register" className="hak-footer-link">S'inscrire</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
