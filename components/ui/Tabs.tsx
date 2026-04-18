'use client';

import * as RadixTabs from '@radix-ui/react-tabs';

/** Thin Radix Tabs wrapper styled with @theme design tokens. */
export function Tabs({
  children,
  defaultValue,
  value,
  onValueChange,
  className,
}: {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}) {
  return (
    <RadixTabs.Root
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      className={className}
    >
      {children}
    </RadixTabs.Root>
  );
}

/** Tabs navigation list container. */
export function TabsList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <RadixTabs.List
      className={[
        'flex gap-1 rounded-[var(--radius-lg)] p-2',
        'bg-[color:var(--color-surface-container-low)]',
        className ?? '',
      ]
        .join(' ')
        .trim()}
    >
      {children}
    </RadixTabs.List>
  );
}

/** A single tab trigger button. */
export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <RadixTabs.Trigger
      value={value}
      className={[
        'px-3 py-1.5 rounded-[var(--radius-lg)] text-sm font-medium font-[family-name:var(--font-headline)] transition-colors',
        'text-[color:var(--color-on-surface-variant)]',
        'data-[state=active]:bg-[color:var(--color-surface-container-high)]',
        'data-[state=active]:text-[color:var(--color-on-surface)]',
        className ?? '',
      ]
        .join(' ')
        .trim()}
    >
      {children}
    </RadixTabs.Trigger>
  );
}

/** Tab content panel. */
export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <RadixTabs.Content value={value} className={className}>
      {children}
    </RadixTabs.Content>
  );
}
