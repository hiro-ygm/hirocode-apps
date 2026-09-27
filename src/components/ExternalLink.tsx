import type { ReactNode } from 'react'

type Props = {
  href: string
  className?: string
  children: ReactNode
}

export function ExternalLink({ href, className, children }: Props) {
  return (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {children}
      <span aria-hidden="true" className="external-mark">
        ↗
      </span>
      <span className="sr-only">（新しいタブで開きます）</span>
    </a>
  )
}
