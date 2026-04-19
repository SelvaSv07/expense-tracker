export function OverviewPageHeader() {
  return (
    <div className="min-w-0 flex-1">
      <p
        className="text-[22px] leading-tight font-bold tracking-tight"
        style={{ color: "var(--cazura-text)" }}
      >
        Overview
      </p>
      <p
        className="mt-1 text-[13px] font-medium"
        style={{ color: "var(--cazura-muted)" }}
      >
        Quick summary of your finances
      </p>
    </div>
  );
}
