import './App.css';
import { AdminLayout } from './layout';
import { Login } from './pages/Auth/login';
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastContainer } from 'react-toastify';
import { UsageProvider } from './contexts/UsageContext';
import AppBuilder from './app_creator/AppBuilder';
import AppBuilderList from './app_creator/AppBuilderList';
import MiddleContent from './pages/entryPage';
import MultiAgent from './pages/MultiAgent';
import Administration from './pages/Administration';

function App() {
  const clientId = '573823221354-d175srri1ta9un581atkp7b9qenst32u.apps.googleusercontent.com';
  return (
    <BrowserRouter>
      <UsageProvider>
        <GoogleOAuthProvider clientId={clientId}>
          <ToastContainer />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route element={<AdminLayout />}>
              <Route path="welcome" element={<MiddleContent />} />
              <Route path="multi-agent" element={<MultiAgent />} />
              <Route path="app-builder" element={<AppBuilderList />} />
              <Route path="app-builder/new" element={<AppBuilder />} />
              <Route path="app-builder/edit/:id" element={<AppBuilder />} />
              <Route path="administration/*" element={<Administration />} />
            </Route>
            <Route path="*" element={<Navigate to="/welcome" replace />} />
          </Routes>
        </GoogleOAuthProvider>
      </UsageProvider>
    </BrowserRouter>
  );
}

export default App;
