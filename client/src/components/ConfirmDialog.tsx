import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BaseProps {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  /** Disables the buttons and shows "Working…" while the action runs. */
  pending?: boolean;
  onConfirm: () => void;
}

/** Uncontrolled: `trigger` is the button that opens the dialog. */
interface TriggerProps extends BaseProps {
  trigger: ReactNode;
  open?: never;
  onOpenChange?: never;
}

/** Controlled: the caller owns `open` (one dialog shared by many table rows). */
interface ControlledProps extends BaseProps {
  trigger?: never;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** A confirm step in front of a destructive or irreversible action. */
export function ConfirmDialog(props: TriggerProps | ControlledProps) {
  const { title, description, confirmLabel = "Delete", destructive = true, pending = false, onConfirm } = props;
  const controlled = props.trigger === undefined;
  return (
    <AlertDialog {...(controlled ? { open: props.open, onOpenChange: props.onOpenChange } : {})}>
      {!controlled && <AlertDialogTrigger asChild>{props.trigger}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className={cn(destructive && buttonVariants({ variant: "destructive" }))}
            onClick={(e) => {
              // Controlled callers close the dialog themselves once the action settles.
              if (controlled) e.preventDefault();
              onConfirm();
            }}
          >
            {pending ? "Working…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
