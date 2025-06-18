import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AddProduct from './Components/AddProduct'
import AdminLayout from './Components/AdminLayout'
import AdminLogin from './Components/AdminLogin'
import CategoryManagement from './Components/CategoryManagement'
import ChangePassword from './Components/ChangePassword'
import ForgotPassword from './Components/ForgotPassword'
import ProductListing from './Components/ProductListing'
import AdminProfile from './Components/Profile'
import ShopManagement from './Components/ShopManagement'
import { UserProvider } from './Context/userContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Admin Routes */}
          <Route path='/login' element={<AdminLogin />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />

          {/* Protected Admin Routes */}
          <Route path='/dashboard' element={<AdminLayout />}>
            <Route index element={<h1>Dashboard</h1>} />

            <Route path='/dashboard/change-password' element={<ChangePassword />} />
            <Route path='/dashboard/profile' element={<AdminProfile />} />
            <Route path='/dashboard/shops' element={<ShopManagement />} />
            <Route path='/dashboard/add-product' element={<AddProduct />} />
            <Route path='/dashboard/products' element={<ProductListing />} />
            <Route path='/dashboard/categories' element={<CategoryManagement />} />
            {/* Add other protected routes here */}
          </Route>

          {/* Catch-all route */}
          <Route path='*' element={<Navigate to='/login' replace />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  </StrictMode>
)
