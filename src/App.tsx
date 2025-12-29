import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { AppShell } from '@/components/layout/AppShell'
import { RoleGate } from '@/components/shared/RoleGate'
import { Skeleton } from '@/components/ui/skeleton'

// Pages
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { MerchantsPage } from '@/pages/MerchantsPage'
import { MerchantDetailPage } from '@/pages/MerchantDetailPage'
import { TicketsPage } from '@/pages/TicketsPage'
import { TicketDetailPage } from '@/pages/TicketDetailPage'
import { TasksPage } from '@/pages/TasksPage'
import { UsersPage } from '@/pages/UsersPage'
import { SettingsPage } from '@/pages/SettingsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="merchants" element={<MerchantsPage />} />
        <Route path="merchants/:id" element={<MerchantDetailPage />} />
        <Route
          path="tickets"
          element={
            <RoleGate allowed={['support', 'ops', 'admin']} fallback={<Navigate to="/" replace />}>
              <TicketsPage />
            </RoleGate>
          }
        />
        <Route
          path="tickets/:id"
          element={
            <RoleGate allowed={['support', 'ops', 'admin']} fallback={<Navigate to="/" replace />}>
              <TicketDetailPage />
            </RoleGate>
          }
        />
        <Route path="tasks" element={<TasksPage />} />
        <Route
          path="users"
          element={
            <RoleGate allowed={['admin']} fallback={<Navigate to="/" replace />}>
              <UsersPage />
            </RoleGate>
          }
        />
        <Route
          path="settings"
          element={
            <RoleGate allowed={['admin']} fallback={<Navigate to="/" replace />}>
              <SettingsPage />
            </RoleGate>
          }
        />
      </Route>

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
