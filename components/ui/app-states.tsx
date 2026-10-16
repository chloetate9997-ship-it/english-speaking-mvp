import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LoadingState({
  label = "正在加载",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-48 flex-col items-center justify-center gap-3 text-sm text-subtle",
        className,
      )}
      role="status"
    >
      <LoaderCircle aria-hidden className="size-6 animate-spin text-ink" />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-48 flex-col items-center justify-center gap-2 px-6 text-center",
        className,
      )}
    >
      <Inbox aria-hidden className="size-7 text-subtle" />
      <h2 className="font-medium text-ink">{title}</h2>
      {description ? <p className="text-sm text-subtle">{description}</p> : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-48 flex-col items-center justify-center gap-3 px-6 text-center",
        className,
      )}
      role="alert"
    >
      <AlertCircle aria-hidden className="size-7 text-accent-red" />
      <p className="text-sm text-subtle">{message}</p>
      {onRetry ? (
        <Button onClick={onRetry} type="button" variant="outline">
          重试
        </Button>
      ) : null}
    </div>
  );
}
