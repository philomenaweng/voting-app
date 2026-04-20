'use client'

import { useFormStatus } from 'react-dom'

interface Props {
  children: React.ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}

export default function SubmitButton({ children, className = '', variant = 'primary', disabled }: Props) {
  const { pending } = useFormStatus()

  const base = 'inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200',
    danger: 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200',
  }

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {pending ? 'Saving…' : children}
    </button>
  )
}
