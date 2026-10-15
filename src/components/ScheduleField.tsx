import { useId } from 'react'
type Props = { label: string; value: string; onChange: (value: string) => void; error?: string; hint?: string; type?: string; disabled?: boolean; maxLength?: number }
export default function ScheduleField({ label, value, onChange, error, hint, type = 'text', disabled, maxLength = 160 }: Props) {
  const id = useId()
  return <div className="field"><label htmlFor={id}>{label}</label><input id={id} value={value} onChange={e => onChange(e.target.value)} type={type} disabled={disabled} maxLength={maxLength}
    min={type === 'date' ? '1900-01-01' : undefined} max={type === 'date' ? '9999-12-31' : undefined}
    aria-invalid={!!error} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}/>
    {hint && <small id={`${id}-hint`}>{hint}</small>}{error && <small id={`${id}-error`} className="error-text">{error}</small>}
  </div>
}
