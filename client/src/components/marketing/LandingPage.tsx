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

import { ThemeToggle } from "../theme/ThemeToggle";

const features = [
  { number: "01", title: "Build the route", text: "Place sources, transforms, and sinks exactly where they belong. The canvas is the diagram your team can actually operate.", icon: GitBranch, detail: "Visual DAG editor" },
  { number: "02", title: "Check the logic", text: "Before execution, validation calls out invalid edges, cycles, missing configuration, and disconnected work.", icon: ShieldCheck, detail: "Preflight validation" },
  { number: "03", title: "Read the run", text: "Progress, output chunks, node inspection, and execution history stay attached to the flow they came from.", icon: Sparkles, detail: "Live observability" }
];

export const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="marketing-shell">
      <nav className="marketing-nav">
        <Link href="/" className="marketing-logo" aria-label="FlowEngine home"><span>F</span> FlowEngine</Link>
        <div className={`marketing-links ${menuOpen ? "open" : ""}`}>
          <a href="#product" onClick={() => setMenuOpen(false)}>Product</a>
          <a href="#anatomy" onClick={() => setMenuOpen(false)}>Anatomy</a>
          <a href="#workspace" onClick={() => setMenuOpen(false)}>Workspace</a>
          <a href="#docs" onClick={() => setMenuOpen(false)}>Docs</a>
        </div>
        <ThemeToggle />
        <div className="marketing-actions">
          <Link href="/app" className="nav-signin">Sign in</Link>
          <Link href="/app" className="button button-dark button-small">Start building <ArrowRight size={14} /></Link>
          <button className="mobile-menu" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((value) => !value)}>
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </nav>

      <section className="marketing-hero" id="product">
        <div className="hero-preview" id="demo"><ProductPreview /></div>
        <div className="hero-ruler hero-ruler-left"><span>01 / build</span></div>
        <div className="hero-ruler hero-ruler-right"><span>Live editor</span></div>
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-mark"><Sparkles size={12} /></span> Pipeline control, without the fog</p>
          <h1>Make every data handoff <em>visible.</em></h1>
          <p className="hero-lede">FlowEngine is a calm place to design, verify, and run the work moving between your systems.</p>
          <div className="hero-actions">
            <Link href="/app" className="button button-dark">Start building <ArrowRight size={16} /></Link>
            <a href="#demo" className="button button-light"><span className="play-icon"><Play size={12} fill="currentColor" /></span> See the workspace</a>
          </div>
          <div className="hero-note"><span className="status-check"><Check size={12} /></span> Built as a personal, local-first project <span className="note-divider" /> No plan selection</div>
        </div>
      </section>

      <section className="proof-strip" aria-label="FlowEngine capabilities">
        <span className="proof-intro">A small system with a clear view</span>
        <span><strong>05</strong> node primitives</span>
        <span><strong>01</strong> visible execution trail</span>
        <span><Command size={14} /> command palette</span>
      </section>

      <section className="feature-section" id="anatomy">
        <div className="section-heading">
          <p className="eyebrow">Anatomy of a healthy run</p>
          <h2>The diagram is the <em>interface.</em></h2>
          <p>There is no separate “operations layer” to decipher after the fact. The logic, safety checks, and result all live in the same frame.</p>
        </div>
        <div className="feature-grid" aria-label="Core workflow capabilities">
          {features.map((feature) => {
            const Icon = feature.icon;
            return <article className="feature-item" key={feature.number}>
              <span className="feature-number">{feature.number}</span>
              <div className="feature-content"><span className="feature-detail"><Icon size={16} /> {feature.detail}</span><h3>{feature.title}</h3><p>{feature.text}</p></div>
              <a href="#demo">See it in the editor <ArrowRight size={14} /></a>
            </article>;
          })}
        </div>
      </section>

      <section className="workflow-section" id="workspace">
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
          <p className="eyebrow">One operational surface</p>
          <h2>See where the work is <em>going.</em></h2>
          <p>Every node has a job. Every edge has a meaning. The workspace makes those decisions legible enough to review, debug, and improve in one sitting.</p>
          <Link href="/app" className="text-link">Open the workspace <ArrowRight size={15} /></Link>
        </div>
      </section>

      <section className="cta-section" id="docs">
        <div><p className="eyebrow">The workspace is ready</p><h2>Draw the route.<br /><em>Run the route.</em></h2></div>
        <Link href="/app" className="button button-cream">Open FlowEngine <ArrowRight size={16} /></Link>
      </section>

      <footer className="marketing-footer">
        <div className="footer-brand"><Link href="/" className="marketing-logo"><span>F</span> FlowEngine</Link><p>Visual pipelines for teams who care<br />how the work moves.</p></div>
        <div className="footer-links"><div><p>Product</p><a href="#product">Workspace</a><a href="#anatomy">Anatomy</a><a href="#workspace">Execution</a></div><div><p>Resources</p><a href="#docs">Documentation</a><a href="#demo">Demo</a><a href="mailto:hello@flowengine.dev">Contact</a></div><div><p>Project</p><a href="#docs">Privacy</a><a href="#docs">Terms</a><a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a></div></div>
        <div className="footer-bottom"><span>© 2026 FlowEngine</span><span>Built for better data movement.</span></div>
      </footer>
    </main>
  );
};
