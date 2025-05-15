export function Bar({
  used,
  total,
  label,
  divider,
}: {
  used?: number;
  total?: number;
  label?: string;
  divider?: number;
}) {
  return (
    <div className="flex w-full items-center gap-2">
      <div className="relative h-2 w-full bg-primary/20 rounded">
        <div
          className="absolute left-0 top-0 h-2 rounded bg-primary transition-all"
          style={{
            width: `${Math.min(((used ?? 0) / (total ?? 1)) * 100, 100)}%`,
          }}
        />
      </div>
      <span className="text-sm">
        {((used ?? 0) / (divider ?? 1)).toFixed(2)}
        {label}/{((total ?? 0) / (divider ?? 1)).toFixed(0)}
        {label}
      </span>
    </div>
  );
}
