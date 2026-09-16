"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Command,
  GitBranch,
  Menu,
  Play,
  ShieldCheck,
  Sparkles,
  X
} from "lucide-react";
import { ProductPreview } from "./ProductPreview";

const features = [
  { number: "01", title: "Compose visually", text: "Build source, transform, and sink flows on a canvas that stays readable as systems grow.", icon: GitBranch },
  { number: "02", title: "Run with confidence", text: "Validation catches broken edges, missing configs, disconnected nodes, and cycles before execution.", icon: ShieldCheck },
  { number: "03", title: "See the work move", text: "Watch node state, output chunks, run history, and progress update as your pipeline executes.", icon: Sparkles }
];

const pricing = [
  { name: "Starter", description: "For exploring event-driven workflows.", monthly: 0, features: ["3 active pipelines", "1,000 records / month", "Run history", "Community support"] },
  { name: "Builder", description: "For shipping dependable automations.", monthly: 29, features: ["Unlimited pipelines", "100,000 records / month", "Node inspectors", "Priority support"] },
  { name: "Scale", description: "For teams operating critical flows.", monthly: 89, features: ["Unlimited records", "Shared workspaces", "Advanced run analytics", "SLA support"] }
];

export const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [annual, setAnnual] = useState(true);

  return (
    <main className="marketing-shell">
      <nav className="marketing-nav">
        <Link href="/" className="marketing-logo" aria-label="FlowEngine home"><span>F</span> FlowEngine</Link>
        <div className={`marketing-links ${menuOpen ? "open" : ""}`}>
          <a href="#product" onClick={() => setMenuOpen(false)}>Product</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
          <a href="#docs" onClick={() => setMenuOpen(false)}>Docs</a>
        </div>
        <div className="marketing-actions">
          <Link href="/app" className="nav-signin">Sign in</Link>
          <Link href="/app" className="button button-dark button-small">Start building <ArrowRight size={14} /></Link>
          <button className="mobile-menu" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((value) => !value)}>
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </nav>

      <section className="marketing-hero" id="product">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-mark"><Sparkles size={12} /></span> A clearer way to move data</p>
          <h1>Turn messy data flows into <em>working systems.</em></h1>
          <p className="hero-lede">FlowEngine gives your team a visual, observable workspace for building pipelines that run reliably from first sketch to production.</p>
          <div className="hero-actions">
            <Link href="/app" className="button button-dark">Start building <ArrowRight size={16} /></Link>
            <a href="#demo" className="button button-light"><span className="play-icon"><Play size={12} fill="currentColor" /></span> See the workspace</a>
          </div>
          <div className="hero-note"><span className="status-check"><Check size={12} /></span> No credit card required <span className="note-divider" /> Open-source core</div>
        </div>
        <div className="hero-preview" id="demo"><ProductPreview /></div>
      </section>

      <section className="proof-strip" aria-label="Product capabilities">
        <span className="proof-intro">Designed for the whole flow</span>
        <span><strong>5</strong> native node types</span>
        <span><strong>100%</strong> observable runs</span>
        <span><strong>0</strong> hidden state</span>
        <span><Command size={14} /> Command palette ready</span>
      </section>

      <section className="feature-section" id="how-it-works">
        <div className="section-heading">
          <p className="eyebrow">The FlowEngine approach</p>
          <h2>Clarity at every <em>step.</em></h2>
          <p>Build with the speed of a visual tool, keep the control of a real engineering system.</p>
        </div>
        <div className="feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon;
            return <article className="feature-item" key={feature.number}>
              <div className="feature-topline"><span>{feature.number}</span><Icon size={18} /></div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
              <a href="#demo">Explore <ArrowRight size={14} /></a>
            </article>;
          })}
        </div>
      </section>

      <section className="workflow-section">
        <div className="workflow-art">
          <div className="workflow-art-label">From event to outcome</div>
          <div className="workflow-steps">
            <div><span className="workflow-number">01</span><b>Ingest</b><small>Bring in the signal</small></div>
            <div className="workflow-arrow"><ArrowRight size={18} /></div>
            <div><span className="workflow-number">02</span><b>Transform</b><small>Shape what matters</small></div>
            <div className="workflow-arrow"><ArrowRight size={18} /></div>
            <div><span className="workflow-number">03</span><b>Deliver</b><small>Send it where it belongs</small></div>
          </div>
          <div className="workflow-bottom"><span className="h-2 w-2 rounded-full bg-[#58c9a3]" /> Live execution trail <span className="ml-auto text-white/40">42 records / 1.8s</span></div>
        </div>
        <div className="workflow-copy">
          <p className="eyebrow">Built for momentum</p>
          <h2>Your pipeline should explain <em>itself.</em></h2>
          <p>Every node has a job. Every edge has a meaning. FlowEngine makes that logic visible, so the team can review, debug, and improve the system together.</p>
          <Link href="/app" className="text-link">Open the workspace <ArrowRight size={15} /></Link>
        </div>
      </section>

      <section className="pricing-section" id="pricing">
        <div className="section-heading pricing-heading">
          <p className="eyebrow">Simple to start</p>
          <h2>Choose your <em>pace.</em></h2>
          <div className="billing-toggle"><button className={annual ? "active" : ""} onClick={() => setAnnual(true)} type="button">Yearly <span>Save 20%</span></button><button className={!annual ? "active" : ""} onClick={() => setAnnual(false)} type="button">Monthly</button></div>
        </div>
        <div className="pricing-grid">
          {pricing.map((plan) => <article className={`price-card ${plan.name === "Builder" ? "featured" : ""}`} key={plan.name}>
            {plan.name === "Builder" ? <div className="popular-label">Most popular</div> : null}
            <p className="price-name">{plan.name}</p><p className="price-description">{plan.description}</p>
            <div className="price"><span>$</span>{annual ? Math.round(plan.monthly * .8) : plan.monthly}<small>/ month</small></div>
            <Link href="/app" className={`button ${plan.name === "Builder" ? "button-dark" : "button-light"}`}>{plan.monthly === 0 ? "Start free" : "Get started"} <ArrowRight size={14} /></Link>
            <div className="price-rule" />
            <ul>{plan.features.map((item) => <li key={item}><Check size={14} /> {item}</li>)}</ul>
          </article>)}
        </div>
      </section>

      <section className="cta-section" id="docs">
        <div><p className="eyebrow">Make the next flow the good one</p><h2>Less wiring. More <em>shipping.</em></h2></div>
        <Link href="/app" className="button button-cream">Open FlowEngine <ArrowRight size={16} /></Link>
      </section>

      <footer className="marketing-footer">
        <div className="footer-brand"><Link href="/" className="marketing-logo"><span>F</span> FlowEngine</Link><p>Visual pipelines for teams who care<br />how the work moves.</p></div>
        <div className="footer-links"><div><p>Product</p><a href="#product">Workspace</a><a href="#how-it-works">How it works</a><a href="#pricing">Pricing</a></div><div><p>Resources</p><a href="#docs">Documentation</a><a href="#demo">Demo</a><a href="mailto:hello@flowengine.dev">Contact</a></div><div><p>Company</p><a href="#docs">Privacy</a><a href="#docs">Terms</a><a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a></div></div>
        <div className="footer-bottom"><span>© 2026 FlowEngine</span><span>Built for better data movement.</span></div>
      </footer>
    </main>
  );
};
