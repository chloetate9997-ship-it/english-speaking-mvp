"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";

const scopeOptions = [
  { value: "full", label: "整篇" },
  { value: "segment", label: "分段" },
  { value: "custom", label: "自选" },
] as const;

type ScopeValue = (typeof scopeOptions)[number]["value"];

export function SegmentedControlPreview() {
  const [scope, setScope] = useState<ScopeValue>("full");

  return (
    <SegmentedControl
      ariaLabel="复述范围"
      onChange={setScope}
      options={scopeOptions}
      value={scope}
    />
  );
}
