import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { easeOut } from './motion'

type Props = {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  as?: 'div' | 'li'
}

// Aparece subindo quando entra na tela
export function Reveal({ children, className, delay = 0, y = 28, as = 'div' }: Props) {
  const Component = as === 'li' ? motion.li : motion.div
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: easeOut, delay }}
    >
      {children}
    </Component>
  )
}
