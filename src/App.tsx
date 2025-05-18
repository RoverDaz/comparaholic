import React from 'react';
import { BrowserRouter as Router, Routes, Route, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Auth } from './pages/Auth';
import { Settings } from './pages/Settings';
import { Compare } from './pages/Compare';
import { CarInsurance } from './pages/CarInsurance';
import { CarInsuranceResults } from './pages/CarInsuranceResults';
import { BankAccount } from './pages/BankAccount';
import { BankAccountResults } from './pages/BankAccountResults';
import { CarPayment } from './pages/CarPayment';
import { CarPaymentResults } from './pages/CarPaymentResults';
import { CellPhonePlan } from './pages/CellPhonePlan';
import { CellPhonePlanResults } from './pages/CellPhonePlanResults';
import { HomeInsurance } from './pages/HomeInsurance';
import { HomeInsuranceResults } from './pages/HomeInsuranceResults';
import { InternetCable } from './pages/InternetCable';
import { InternetCableResults } from './pages/InternetCableResults';
import { MortgageRate } from './pages/MortgageRate';
import { MortgageRateResults } from './pages/MortgageRateResults';
import { RealEstateBroker } from './pages/RealEstateBroker';
import { RealEstateBrokerResults } from './pages/RealEstateBrokerResults';
import { AuthProvider } from './contexts/AuthContext';
import { CategoryProvider } from './contexts/CategoryContext';
import { Admin } from './pages/Admin';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'auth', element: <Auth /> },
      { path: 'settings', element: <Settings /> },
      { path: 'admin', element: <Admin /> },
      { path: 'compare/:categorySlug', element: <Compare /> },
      { path: 'compare/:categorySlug/:step', element: <Compare /> },
      { path: 'compare/:categorySlug/results', element: <Compare /> },
      { path: 'bank-fees', element: <Compare /> },
      { path: 'bank-fees/:step', element: <Compare /> },
      { path: 'bank-fees/results', element: <Compare /> },
      { path: 'car-insurance', element: <Compare /> },
      { path: 'car-insurance/:step', element: <Compare /> },
      { path: 'car-insurance/results', element: <Compare /> },
      { path: 'car-payment', element: <Compare /> },
      { path: 'car-payment/:step', element: <Compare /> },
      { path: 'car-payment/results', element: <Compare /> },
      { path: 'cell-phone-plan', element: <Compare /> },
      { path: 'cell-phone-plan/:step', element: <Compare /> },
      { path: 'cell-phone-plan/results', element: <Compare /> },
      { path: 'home-insurance', element: <Compare /> },
      { path: 'home-insurance/:step', element: <Compare /> },
      { path: 'home-insurance/results', element: <Compare /> },
      { path: 'internet-cable', element: <Compare /> },
      { path: 'internet-cable/:step', element: <Compare /> },
      { path: 'internet-cable/results', element: <Compare /> },
      { path: 'mortgage-rate', element: <Compare /> },
      { path: 'mortgage-rate/:step', element: <Compare /> },
      { path: 'mortgage-rate/results', element: <Compare /> },
      { path: 'real-estate-broker', element: <Compare /> },
      { path: 'real-estate-broker/:step', element: <Compare /> },
      { path: 'real-estate-broker/results', element: <Compare /> }
    ]
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

function App() {
  return (
    <AuthProvider>
      <CategoryProvider>
        <RouterProvider router={router} />
      </CategoryProvider>
    </AuthProvider>
  );
}

export default App;