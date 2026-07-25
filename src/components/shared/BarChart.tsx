import { motion } from "framer-motion";

interface BarDatum {
  label: string;
  value: number; // 0-100
}

export function BarChart({ data }: { data: BarDatum[] }) {
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-graydark">{d.label}</span>
            <span className="font-mono text-graytext">{d.value}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${d.value}%` }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: "easeOut" }}
              className="h-full rounded-full bg-primary"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
