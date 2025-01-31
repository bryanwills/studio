import { PropsWithChildren } from "react";

export function ButtonGroup({ children }: PropsWithChildren) {
  return (
    <div
      className={`flex h-9 items-center gap-1 rounded border border-neutral-200 bg-neutral-100 px-1 dark:border-neutral-800 dark:bg-neutral-900`}
    >
      {children}
    </div>
  );
}

interface ButtonGroupItemProps {}

export function ButtonGroupItem({
  children,
}: PropsWithChildren<ButtonGroupItemProps>) {
  return (
    <button
      className={`flex h-7 cursor-pointer items-center rounded-sm px-2 text-sm text-neutral-600 transition-all hover:bg-neutral-200 dark:text-neutral-400 hover:dark:bg-neutral-800`}
    >
      {children}
    </button>
  );
}
