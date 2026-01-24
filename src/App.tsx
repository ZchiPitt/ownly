import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, OfflineProvider, ToastProvider, ConfirmProvider } from '@/contexts'
import { AppShell } from '@/components/layout'
import { ToastContainer } from '@/components/Toast'
import { SignupPage, LoginPage, SettingsPage, ResetPasswordPage, ResetPasswordConfirmPage, AddItemPage, ItemEditorPage, DashboardPage, InventoryPage, ItemDetailPage, EditItemPage, SearchPage, NotificationsPage, ShoppingPage, NotFoundPage } from '@/pages'
import { useEffect } from 'react'
import { useToast } from '@/hooks/useToast'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider maxToasts={5}>
        <ConfirmProvider>
          <AppContent />
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}

/** Inner component that can use toast context */
function AppContent() {
  return (
    <OfflineProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth routes - outside AppShell (no bottom nav) */}
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/reset-password/confirm" element={<ResetPasswordConfirmPage />} />

            {/* Protected routes - inside AppShell (with bottom nav) */}
            <Route
              path="/*"
              element={
                <AppShell>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/add" element={<AddItemPage />} />
                    <Route path="/add/edit" element={<ItemEditorPage />} />
                    <Route path="/inventory" element={<InventoryPage />} />
                    <Route path="/item/:id" element={<ItemDetailPage />} />
                    <Route path="/item/:id/edit" element={<EditItemPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/shopping" element={<ShoppingPage />} />
                    {/* 404 for protected routes */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </AppShell>
              }
            />
            {/* 404 for auth routes and any other unmatched routes */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          {/* Toast notifications - rendered via separate component */}
          <ToastNotifications />

          {/* Service Worker Update Detection */}
          <ServiceWorkerUpdateDetector />
        </BrowserRouter>
      </AuthProvider>
    </OfflineProvider>
  )
}

/** Toast notifications container - accesses ToastContext internally */
function ToastNotifications() {
  const { toasts, dismiss } = useToast()
  return <ToastContainer toasts={toasts} onDismiss={dismiss} />
}

/** Detects service worker updates and shows notification */
function ServiceWorkerUpdateDetector() {
  const { info } = useToast()

  useEffect(() => {
    // Listen for the custom event dispatched by vite-plugin-pwa
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail?.needRefresh) {
        info('App update available', {
          action: {
            label: 'Refresh',
            onClick: () => {
              // Trigger the update and reload
              if (customEvent.detail?.updateServiceWorker) {
                customEvent.detail.updateServiceWorker()
              } else {
                // Fallback: force reload
                window.location.reload()
              }
            }
          },
          duration: 0 // Don't auto-dismiss
        })
      }
    }

    window.addEventListener('pwa-update-available', handler)

    // Also check on page focus (when user returns to the app)
    const onFocus = () => {
      // If there's a waiting service worker, trigger the update event
      if ((window as any).workbox) {
        (window as any).workbox.addEventListener('waiting', () => {
          const event = new CustomEvent('pwa-update-available', {
            detail: { needRefresh: true }
          })
          window.dispatchEvent(event)
        })
      }
    }

    window.addEventListener('focus', onFocus)

    return () => {
      window.removeEventListener('pwa-update-available', handler)
      window.removeEventListener('focus', onFocus)
    }
  }, [info])

  return null
}

export default App
