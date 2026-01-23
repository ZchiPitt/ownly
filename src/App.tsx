import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <main className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Clekee - Smart Home Inventory
            </h1>
            <p className="text-gray-600">
              Welcome to Clekee! Your smart home inventory app.
            </p>
          </main>
          <Routes>
            <Route path="/" element={<div className="p-4 text-center">Home</div>} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
