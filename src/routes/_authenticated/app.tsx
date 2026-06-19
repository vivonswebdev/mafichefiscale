import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "Application — mafiche.be" },
      { name: "description", content: "Application complète mafiche.be : dashboard, fiches 281.20, paie, attestations, échéances." },
    ],
  }),
  component: AppPage,
});

function AppPage() {
  return (
    <iframe
      src="/app/index.html"
      title="mafiche.be application"
      className="w-full block"
      style={{
        height: "calc(100vh - 3.5rem)",
        border: 0,
        background: "#0c1019",
      }}
    />
  );
}
