import type * as React from "react";

// ponytail: the three lucide glyphs shadcn's checkbox/select want, inlined so the
// wizard needs no icon dependency. Add lucide-react only if the icon count grows.
function Icon({ d, ...props }: React.ComponentProps<"svg"> & { d: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={d} />
    </svg>
  );
}

export function CheckIcon(props: React.ComponentProps<"svg">) {
  return <Icon d="M20 6 9 17l-5-5" {...props} />;
}

export function ChevronDownIcon(props: React.ComponentProps<"svg">) {
  return <Icon d="m6 9 6 6 6-6" {...props} />;
}

export function ChevronUpIcon(props: React.ComponentProps<"svg">) {
  return <Icon d="m18 15-6-6-6 6" {...props} />;
}
