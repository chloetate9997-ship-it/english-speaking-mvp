import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

const actionClassName =
  "inline-flex h-[52px] w-full items-center justify-center rounded-button bg-ink px-5 text-[15px] font-semibold text-white transition-opacity hover:opacity-90";

type PrimaryActionLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className" | "children">;

type PrimaryActionButtonProps = {
  href?: undefined;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">;

export type PrimaryActionProps = PrimaryActionLinkProps | PrimaryActionButtonProps;

export function PrimaryAction(props: PrimaryActionProps) {
  if (typeof props.href === "string") {
    const { href, className, ...linkProps } = props;
    return <Link className={cn(actionClassName, className)} href={href} {...linkProps} />;
  }

  const { href, className, type, ...buttonProps } = props;
  void href;
  return <button className={cn(actionClassName, className)} type={type ?? "button"} {...buttonProps} />;
}
