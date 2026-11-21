import { useState } from "react";
import { ArrowRight, Check, RotateCcw, CarFront, Backpack } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FamilyDemo() {
  const [step, setStep] = useState<"assigned" | "waiting" | "covered">("assigned");
  return (
    <div className="grid gap-4" aria-label="Family schedule demo">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold">Tuesday · Emma's soccer</p>
        <Button variant="ghost" size="icon" aria-label="Restart demo" title="Restart demo" onClick={() => setStep("assigned")}><RotateCcw className="h-4 w-4" /></Button>
      </div>
      <div className="border-y py-4">
        <p className="text-2xl font-extrabold">Soccer practice</p>
        <p className="mt-1 text-sm text-muted-foreground">5:00–6:00 PM · Riverside field</p>
        <div className="mt-5 grid gap-3 text-sm">
          <p className="flex items-center gap-2"><CarFront className="h-4 w-4 text-muted-foreground" />Drop-off <b className="ml-auto">Dad</b><Check className="h-4 w-4 text-covered" /></p>
          <p className="flex items-center gap-2"><CarFront className="h-4 w-4 text-muted-foreground" />Pickup <b className="ml-auto">{step === "covered" ? "Grandma" : "Mom"}</b><Check className="h-4 w-4 text-covered" /></p>
          <p className="flex items-center gap-2"><Backpack className="h-4 w-4 text-muted-foreground" />Cleats & water bottle</p>
        </div>
      </div>
      <div className="min-h-28" aria-live="polite" aria-atomic="true">
        {step === "assigned" && <><p className="mb-3 text-sm text-muted-foreground">Mom can't make pickup today.</p><Button className="h-auto min-h-11 w-full whitespace-normal" onClick={() => setStep("waiting")}>Ask Grandma to cover pickup <ArrowRight className="h-4 w-4 shrink-0" /></Button></>}
        {step === "waiting" && <><p className="mb-3 text-sm font-semibold text-waiting">Waiting for Grandma. Mom still owns pickup.</p><Button className="w-full" variant="secondary" onClick={() => setStep("covered")}>Accept as Grandma <Check className="h-4 w-4" /></Button></>}
        {step === "covered" && <><p className="flex items-center gap-2 font-bold text-covered"><Check className="h-5 w-5" />Everything's covered.</p><p className="mt-2 text-sm text-muted-foreground">Grandma accepted. Everyone sees the updated plan.</p></>}
      </div>
      <p className="text-xs text-muted-foreground">Sample family · no changes to your account</p>
    </div>
  );
}