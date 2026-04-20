interface Props {
  voted: number
  total: number
}

export default function ProgressBar({ voted, total }: Props) {
  const pct = total > 0 ? Math.min(Math.round((voted / total) * 100), 100) : 0
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5">
      <div
        className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
