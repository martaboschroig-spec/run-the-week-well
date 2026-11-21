import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, CarFront, Backpack, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FamilyDemo() {
  const [step, setStep] = useState(0);
  const scenes = [
    { title: "One place for the whole week", text: "Soccer, swimming, school meetings. Everyone sees what's coming up.", icon: CalendarDays },
    { title: "Every ride has a name", text: "See who's dropping off and picking up, without another round of messages.", icon: CarFront },
    { title: "Ready before you leave", text: "The things to bring stay right next to the activity. No last-minute trips back home.", icon: Backpack },
  ];
  const scene = scenes[step];
  if (!scene) return null;
  return (
    <div>
      <div className="min-h-24" aria-live="polite">
        <p className="flex items-center gap-2 text-lg font-extrabold"><scene.icon className="h-5 w-5 shrink-0 text-accent-foreground" />{scene.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{scene.text}</p>
      </div>
      <div className="my-5 min-h-64 rounded-2xl bg-muted px-5 py-6" aria-label="Example family activity">
        <p className="text-xs font-bold uppercase text-muted-foreground">Tuesday · 5:00 PM</p>
        <p className="mt-3 text-xl font-extrabold">Emma's soccer</p>
        <p className="mt-1 text-sm text-muted-foreground">Riverside field</p>
        {step === 0 && <div className="mt-6 border-t pt-4"><p className="text-xs font-bold text-muted-foreground">WEDNESDAY · 4:30 PM</p><p className="mt-2 font-bold">Leo's swimming</p><p className="text-sm text-muted-foreground">Community pool</p></div>}
        {step === 1 && <div className="mt-6 grid gap-4 border-t pt-4 text-sm"><p className="flex justify-between">Drop-off <b>Dad</b></p><p className="flex justify-between">Pickup <b>Mom</b></p><p className="flex items-center gap-2 font-semibold text-covered"><Check className="h-4 w-4" />Both rides covered</p></div>}
        {step === 2 && <div className="mt-6 grid gap-3 border-t pt-4 text-sm"><p className="flex items-center gap-2"><Check className="h-4 w-4 text-covered" />Cleats</p><p className="flex items-center gap-2"><Check className="h-4 w-4 text-covered" />Water bottle</p><p className="flex items-center gap-2"><Check className="h-4 w-4 text-covered" />A snack for afterwards</p></div>}
      </div>
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" aria-label="Previous example" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft className="h-4 w-4" /></Button>
        <span className="text-xs text-muted-foreground">{step + 1} of 3</span>
        <Button variant="outline" onClick={() => setStep(step === 2 ? 0 : step + 1)}>{step === 2 ? "See again" : "Next"}<ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}