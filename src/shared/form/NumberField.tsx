import { useState } from 'react'

type Props = {
  id: string
  value: number
  min?: number
  max?: number
  disabled?: boolean
  onChange: (value: number) => void
}

/**
 * A number input that edits as text (so it can be emptied while typing), reports every valid
 * entry clamped to min/max and normalises the text on blur.
 */
export function NumberField({ id, value, min = 1, max, disabled = false, onChange }: Props) {
  const clamp = (raw: string) => {
    const number = Math.floor(Number(raw))
    const atLeastMin = Math.max(min, Number.isFinite(number) ? number : min)
    return max === undefined ? atLeastMin : Math.min(max, atLeastMin)
  }
  const [text, setText] = useState(String(value))
  const [knownValue, setKnownValue] = useState(value)
  if (knownValue !== value) {
    // The value changed from outside (reset, import): show it unless it is what is being typed.
    setKnownValue(value)
    if (clamp(text) !== value) setText(String(value))
  }

  return (
    <input
      id={id}
      type="number"
      min={min}
      max={max}
      step="1"
      disabled={disabled}
      value={text}
      onChange={(event) => {
        const raw = event.currentTarget.value
        setText(raw)
        if (raw.trim() !== '' && Number.isFinite(Number(raw))) onChange(clamp(raw))
      }}
      onBlur={() => {
        const next = clamp(text)
        setText(String(next))
        onChange(next)
      }}
    />
  )
}
