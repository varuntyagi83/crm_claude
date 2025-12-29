import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/database'

interface RoleGateProps {
  allowed: UserRole[]
  children: ReactNode
  fallback?: ReactNode
}

export function RoleGate({ allowed, children, fallback = null }: RoleGateProps) {
  const { profile } = useAuth()

  if (!profile || !allowed.includes(profile.role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
