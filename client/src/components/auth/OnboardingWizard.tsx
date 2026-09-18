"use client";

import { ArrowRight, Check, GitBranch, Play, X } from "lucide-react";
import { useState } from "react";

interface OnboardingWizardProps {
  onComplete: () => void;
}

const steps = [
  { label: "Create", title: "Start with a clean canvas", text: "Drag a source onto the canvas, then connect it to the work you want to do.", icon: GitBranch },
  { label: "Configure", title: "Give each node a job", text: "Select any node to tune its settings. FlowEngine keeps the details close to the work.", icon: Check },
  { label: "Run", title: "Watch the flow move", text: "Run the pipeline and inspect progress, outputs, and history from one workspace.", icon: Play }
];

export const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const [step, setStep] = useState(0);
  const current = steps[step] ?? steps[0]!;
  const Icon = current.icon;

  const finish = () => {
    window.localStorage.setItem("flowengine-onboarding-complete", "true");
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#15201c]/55 p-5">
      <section className="onboarding-card" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <button type="button" className="onboarding-close" onClick={finish} aria-label="Close onboarding"><X size={17} /></button>
        <div className="onboarding-visual">
          <div className="onboarding-mark"><Icon size={24} /></div>
          <div className="onboarding-lines"><span /><span /><span /></div>
          <div className="onboarding-mini-card"><span className="h-2 w-2 rounded-full bg-[#58c9a3]" /> Live pipeline state</div>
        </div>
        <div className="onboarding-content">
          <div className="onboarding-progress">{steps.map((item, index) => <span className={index <= step ? "active" : ""} key={item.label} />)}</div>
          <p className="eyebrow">First steps / 0{step + 1}</p>
          <h2 id="onboarding-title">{current.title}</h2>
          <p>{current.text}</p>
          <button className="button button-dark" type="button" onClick={step === steps.length - 1 ? finish : () => setStep((value) => value + 1)}>
            {step === steps.length - 1 ? "Open my workspace" : "Next"} {step === steps.length - 1 ? <Play size={14} fill="currentColor" /> : <ArrowRight size={14} />}
          </button>
          <button type="button" className="onboarding-skip" onClick={finish}>Skip for now</button>
        </div>
      </section>
    </div>
  );
};
