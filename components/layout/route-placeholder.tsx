import Link from "next/link";
import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { PageHeader } from "@/components/layout/page-header";

interface RoutePlaceholderProps { title: string; description: string; backHref?: string; links?: Array<{ href: string; label: string }>; }
export function RoutePlaceholder({ title, description, backHref = "/", links = [] }: RoutePlaceholderProps) { return <MobileAppShell><PageHeader backHref={backHref} title={title} /><main className="space-y-5 px-6 py-8"><div className="rounded-2xl border bg-card p-5 shadow-sm"><p className="text-sm leading-6 text-muted-foreground">{description}</p></div>{links.length ? <div className="grid gap-3">{links.map((link) => <Link className="rounded-xl border px-4 py-3 text-sm font-medium hover:bg-muted" href={link.href} key={link.href}>{link.label}</Link>)}</div> : null}</main></MobileAppShell>; }
