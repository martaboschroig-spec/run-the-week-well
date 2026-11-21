import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CarFront, Backpack, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneMock } from "@/components/app/PhoneMock";

const SCENES = [
  { title: "One place for the whole week", text: "Everyone sees what's coming up.", icon: CalendarDays },
  { title: "Every ride has a name", text: "Who drops off, who picks up — no more group chats.", icon: CarFront },
  { title: "Ready before you leave", text: "What to bring, right next to the activity.", icon: Backpack },
];

const WEEK = [
  { day: "Tue", time: "5:00", kid: "Emma", act: "Soccer", color: "bg-kid-lavender text-kid-lavender-ink" },
  { day: "Wed", time: "4:30", kid: "Leo", act: "Swimming", color: "bg-kid-blue text-kid-blue-ink" },
  { day: "Thu", time: "3:00", kid: "Sophie", act: "Dance", color: "bg-kid-coral text-kid-coral-ink" },
];

export default function FamilyDemo() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % 3), 3500);
    return () => clearTimeout(t);
  }, [step, paused]);
  const go = (n: number) => { setPaused(true); setStep(n); };
  const scene = SCENES[step]!;

  return (
    <div>
      <PhoneMock className="max-w-[260px]">
        <div key={step} className="min-h-[300px] animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p className="px-1 pt-1 text-[11px] font-bold uppercase text-muted-foreground">This week</p>
          {step === 0 && (
            <div className="mt-2 grid gap-2">
              {WEEK.map((w, i) => (
                <div key={w.day} className="flex items-center gap-3 rounded-xl border bg-background p-2.5 animate-in fade-in slide-in-from-right-4" style={{ animationDelay: `${i * 150}ms`, animationFillMode: "both" }}>
                  <div className="w-9 text-center"><p className="text-[10px] font-bold text-muted-foreground">{w.day}</p><p className="text-xs font-extrabold">{w.time}</p></div>
                  <div><span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + w.color}>{w.kid}</span><p className="mt-1 text-sm font-bold">{w.act}</p></div>
                </div>
              ))}
            </div>
          )}
          {step === 1 && (
            <div className="mt-2 rounded-xl border bg-background p-3">
              <span className="rounded-full bg-kid-lavender px-2 py-0.5 text-[10px] font-bold text-kid-lavender-ink">Emma</span>
              <p className="mt-1 font-extrabold">Soccer · 5:00 PM</p>
              <div className="mt-3 grid gap-2">
                {[["Drop-off", "Dad", "D"], ["Pickup", "Mom", "M"]].map(([k, v, a], i) => (
                  <div key={k} className="flex items-center justify-between rounded-lg bg-muted p-2 animate-in fade-in zoom-in-95" style={{ animationDelay: `${i * 250}ms`, animationFillMode: "both" }}>
                    <span className="flex items-center gap-2 text-xs"><CarFront className="h-4 w-4 text-accent-foreground" />{k}</span>
                    <span className="flex items-center gap-1.5 text-xs font-bold"><span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{a}</span>{v}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-covered animate-in fade-in" style={{ animationDelay: "600ms", animationFillMode: "both" }}><Check className="h-4 w-4" />Both rides covered</p>
            </div>
          )}
          {step === 2 && (
            <div className="mt-2 rounded-xl border bg-background p-3">
              <p className="font-extrabold">Soccer bag</p>
              <div className="mt-3 grid gap-2">
                {["Cleats", "Water bottle", "Shin guards", "A snack"].map((it, i) => (
                  <p key={it} className="flex items-center gap-2 text-sm animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${i * 200}ms`, animationFillMode: "both" }}>
                    <span className="grid h-5 w-5 place-items-center rounded-md bg-covered text-background"><Check className="h-3.5 w-3.5" /></span>{it}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </PhoneMock>
      <div className="mt-5 text-center" aria-live="polite">
        <p className="flex items-center justify-center gap-2 text-lg font-extrabold"><scene.icon className="h-5 w-5 text-accent-foreground" />{scene.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{scene.text}</p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" aria-label="Previous" onClick={() => go((step + 2) % 3)}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex gap-1.5">
          {SCENES.map((s, i) => <button key={s.title} aria-label={s.title} onClick={() => go(i)} className={"h-2 rounded-full transition-all " + (i === step ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30")} />)}
        </div>
        <Button variant="ghost" size="icon" aria-label="Next" onClick={() => go((step + 1) % 3)}><ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
