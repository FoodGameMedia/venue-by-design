export function CheckinExplainer() {
  return (
    <div
      className="mb-6 border-l-[3px] border-primary bg-card p-6"
      data-testid="checkin-explainer"
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Weekly check-in
      </p>
      <h1 className="mt-2 font-serif text-xl text-foreground">Keep the loop going</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Each week you re-score your domains so Venue by Design can refresh your Calm Index, track
        how your venue is shifting, and keep the weekly loop going.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-foreground">
        <span className="font-medium">How to proceed:</span>{" "}
        <span className="text-muted-foreground">
          Answer honestly for a normal trading week. One question at a time. It takes a few minutes.
        </span>
      </p>
    </div>
  );
}
