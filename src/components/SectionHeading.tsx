import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  /** Kept for callers that still pass a counter; the redesign no longer shows it. */
  index?: string;
  label: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  /** Split puts the description in a second column on large screens; stack keeps it under the title. */
  layout?: "stack" | "split";
  /** Centre the heading, for sections that open on a single column. */
  align?: "left" | "center";
}

export function SectionHeading({ label, title, description, className, layout = "split", align = "left" }: SectionHeadingProps) {
  const centered = align === "center";
  const split = !centered && layout === "split";
  return (
    <div className={cn(centered && "mx-auto max-w-3xl text-center", className)}>
      <p className="eyebrow eyebrow-pill">{label}</p>
      <div
        className={cn(
          "mt-6",
          split ? "grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-16" : "max-w-3xl",
          centered && "mx-auto"
        )}
      >
        <h2 className="text-[32px] leading-[1.06] md:text-[44px] lg:text-[52px] [text-wrap:balance]">{title}</h2>
        {description && (
          <p
            className={cn(
              "text-[15.5px] leading-[1.7] text-tide md:text-[16.5px]",
              split ? "lg:pb-1.5" : "mt-4 max-w-2xl",
              centered && "mx-auto"
            )}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
