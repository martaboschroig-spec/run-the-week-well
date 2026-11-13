import type { ReactNode } from "react";

/**
 * Phone shell used to show the product preview as it looks on a handset:
 * dark bezel, dynamic island, status bar and home indicator, with the app
 * screen rendered as children.
 */
export function PhoneMock({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={"mx-auto w-full max-w-[272px] " + className}>
      <div className="relative rounded-[2.5rem] border-[10px] border-foreground bg-foreground p-0 shadow-phone">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-card">
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-2 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-foreground"
          />
          <div className="flex items-center justify-between px-4 pb-1 pt-2.5 text-[10px] font-bold text-foreground">
            <span>9:41</span>
            <span aria-hidden="true" className="flex items-center gap-1.5">
              <span className="flex items-end gap-[2px]">
                <span className="h-[4px] w-[3px] rounded-[1px] bg-foreground" />
                <span className="h-[6px] w-[3px] rounded-[1px] bg-foreground" />
                <span className="h-[8px] w-[3px] rounded-[1px] bg-foreground" />
              </span>
              <span className="relative h-[8px] w-[14px] rounded-[2px] border border-foreground p-[1.5px]">
                <span className="block h-full w-2/3 rounded-[1px] bg-foreground" />
              </span>
            </span>
          </div>
          <div className="px-3 pb-2">{children}</div>
          <div aria-hidden="true" className="flex justify-center pb-2">
            <span className="h-1 w-16 rounded-full bg-foreground/25" />
          </div>
        </div>
      </div>
    </div>
  );
}
