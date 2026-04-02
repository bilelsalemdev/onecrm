import { BrowserRouter, Routes, Route } from 'react-router'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Services } from '@/pages/Services'
import { ServiceDetail } from '@/pages/ServiceDetail'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="services" element={<Services />} />
          <Route path="services/:serviceId" element={<ServiceDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
