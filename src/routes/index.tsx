import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RunTheWeek — your family's week, covered" },
      { name: "description", content: "Who drops off, who picks up and what to bring for every kids' activity. Ask for help and see when everything's covered." },
      { property: "og:title", content: "RunTheWeek — your family's week, covered" },
      { property: "og:description", content: "Who drops off, who picks up, what to bring — all in one calm plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async () => {
    const { data } = await supabase.auth.getSession();
    throw redirect({ to: data.session ? "/schedule" : "/auth", replace: true });
  },
  component: () => null,
});
