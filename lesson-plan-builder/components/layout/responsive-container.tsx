import { cn } from "@/lib/utils";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "narrow" | "wide";
}

const sizeClass = {
  default: "max-w-7xl",
  narrow: "max-w-4xl",
  wide: "max-w-[90rem]",
};

export function ResponsiveContainer({
  children,
  className,
  size = "default",
}: ResponsiveContainerProps) {
  return (
    <div className={cn("mx-auto w-full", sizeClass[size], className)}>{children}</div>
  );
}
