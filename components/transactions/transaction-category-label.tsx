import { CategoryIcon } from "@/lib/category-icon";
import { cn } from "@/lib/utils";

export function TransactionCategoryLabel({
  name,
  icon,
  note,
}: {
  name: string;
  icon: string | null;
  note?: string | null;
}) {
  const hasNote = Boolean(note?.trim());
  return (
    <div
      className={cn(
        "flex gap-2.5",
        hasNote ? "items-start" : "items-center",
      )}
    >
      <div
        className={cn(
          "bg-muted flex size-8 shrink-0 items-center justify-center rounded-md",
          hasNote && "mt-0.5",
        )}
      >
        <CategoryIcon name={icon} className="text-foreground size-4" />
      </div>
      <div className="min-w-0">
        <span className="font-medium">{name}</span>
        {note ? (
          <span className="text-muted-foreground mt-0.5 block text-xs">
            {note}
          </span>
        ) : null}
      </div>
    </div>
  );
}
