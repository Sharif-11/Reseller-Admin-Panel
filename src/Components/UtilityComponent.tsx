// ui/Badge.tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type BadgeProps = {
  children: ReactNode
  className?: string
}

export const Badge = ({ children, className = '' }: BadgeProps) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {children}
    </span>
  )
}
// ui/Button.tsx

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost'
  children: ReactNode
}

export const Button = ({
  variant = 'default',
  children,
  className = '',
  ...props
}: ButtonProps) => {
  const baseClasses =
    'inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'

  const variantClasses = {
    default: 'border-transparent bg-indigo-600 text-white hover:bg-indigo-700',
    outline: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    ghost: 'border-transparent bg-transparent text-gray-700 hover:bg-gray-100',
  }

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
// ui/Input.tsx
import type { InputHTMLAttributes } from 'react'

export const Input = ({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input
      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${className}`}
      {...props}
    />
  )
}
// ui/Select.tsx
import type { SelectHTMLAttributes } from 'react'

type Option = {
  value: string
  label: string
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  options: Option[]
}

export const Select = ({ options, className = '', ...props }: SelectProps) => {
  return (
    <select
      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${className}`}
      {...props}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
// ui/Skeleton.tsx
export const Skeleton = ({ className = '' }: { className?: string }) => {
  return <div className={`bg-gray-200 animate-pulse ${className}`} />
}
// ui/Pagination.tsx
type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const canGoPrev = currentPage > 1
  const canGoNext = currentPage < totalPages

  return (
    <nav className='flex items-center space-x-2'>
      <button
        onClick={() => canGoPrev && onPageChange(currentPage - 1)}
        disabled={!canGoPrev}
        className={`px-3 py-1 rounded-md ${
          canGoPrev ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-400 cursor-not-allowed'
        }`}
      >
        Previous
      </button>

      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        let pageNum
        if (totalPages <= 5) {
          pageNum = i + 1
        } else if (currentPage <= 3) {
          pageNum = i + 1
        } else if (currentPage >= totalPages - 2) {
          pageNum = totalPages - 4 + i
        } else {
          pageNum = currentPage - 2 + i
        }

        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`px-3 py-1 rounded-md ${
              currentPage === pageNum
                ? 'bg-indigo-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {pageNum}
          </button>
        )
      })}

      <button
        onClick={() => canGoNext && onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        className={`px-3 py-1 rounded-md ${
          canGoNext ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-400 cursor-not-allowed'
        }`}
      >
        Next
      </button>
    </nav>
  )
}
