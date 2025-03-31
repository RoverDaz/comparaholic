import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import { TestBrokerForm } from './pages/TestBrokerForm';
import { TestBrokerResults } from './pages/TestBrokerResults';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/compare/:categorySlug" element={<Compare />} />
            <Route path="/compare/car-insurance/:step" element={<CarInsurance />} />
            <Route path="/compare/car-insurance/results" element={<CarInsuranceResults />} />
            <Route path="/compare/bank-fees/:step" element={<BankAccount />} />
            <Route path="/compare/bank-fees/results" element={<BankAccountResults />} />
            <Route path="/compare/new-car-payment/:step" element={<CarPayment />} />
            <Route path="/compare/new-car-payment/results" element={<CarPaymentResults />} />
            <Route path="/compare/cell-phone-plan/:step" element={<CellPhonePlan />} />
            <Route path="/compare/cell-phone-plan/results" element={<CellPhonePlanResults />} />
            <Route path="/compare/home-insurance/:step" element={<HomeInsurance />} />
            <Route path="/compare/home-insurance/results" element={<HomeInsuranceResults />} />
            <Route path="/compare/internet-cable/:step" element={<InternetCable />} />
            <Route path="/compare/internet-cable/results" element={<InternetCableResults />} />
            <Route path="/compare/mortgage-rate/:step" element={<MortgageRate />} />
            <Route path="/compare/mortgage-rate/results" element={<MortgageRateResults />} />
            <Route path="/compare/real-estate-broker/:step" element={<RealEstateBroker />} />
            <Route path="/compare/real-estate-broker/results" element={<RealEstateBrokerResults />} />
            <Route path="/test-broker-form" element={<TestBrokerForm />} />
            <Route path="/test-broker-results" element={<TestBrokerResults />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;