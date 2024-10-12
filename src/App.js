import './App.css';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AdminLayout } from './layout';
import { AdminLayout2 } from './layout/layout2';
import { Login } from './pages/Auth/login';
import { Register } from './pages/Auth/register';
import React, { Suspense } from 'react';

// Lazy Loading Components
const BusinessIntelligence = React.lazy(() => import('./pages/BusinessIntelligence'));
const DisplayData = React.lazy(() => import('./pages/BusinessIntelligence/components/components/DisplayData'));
const HtmlReport = React.lazy(() => import('./pages/Reports/generateHTMLfile'));
const DataSource = React.lazy(() => import('./pages/BusinessIntelligence/components/components/DataSource'));
const Datasets = React.lazy(() => import('./pages/BusinessIntelligence/components/datasets'));
const GeneralTeam = React.lazy(() => import('./pages/BusinessIntelligence/components/settings/components/team/general'));
const GeneralOrganization = React.lazy(() => import('./pages/BusinessIntelligence/components/settings/components/organization/general'));
const GeneralAccount = React.lazy(() => import('./pages/BusinessIntelligence/components/settings/components/account/general'));
const MembersTeam = React.lazy(() => import('./pages/BusinessIntelligence/components/settings/components/team/members'));
const ApiKeys = React.lazy(() => import('./pages/BusinessIntelligence/components/settings/components/team/api-keys'));
const Notification = React.lazy(() => import('./pages/BusinessIntelligence/components/settings/components/account/notification'));
const Legal = React.lazy(() => import('./pages/BusinessIntelligence/components/settings/components/account/legal'));
const MembersOrganization = React.lazy(() => import('./pages/BusinessIntelligence/components/settings/components/organization/members'));
const WhiteLabeling = React.lazy(() => import('./pages/BusinessIntelligence/components/settings/components/organization/white-labeling'));
const Billing = React.lazy(() => import('./pages/BusinessIntelligence/components/settings/components/organization/billing'));
const Usage = React.lazy(() => import('./pages/BusinessIntelligence/components/settings/components/organization/usage'));
const TermsConst = React.lazy(() => import('./pages/BusinessIntelligence/components/settings/components/account/legal/terms'));
const LegalConst = React.lazy(() => import('./pages/BusinessIntelligence/components/settings/components/account/legal/legal'));
const DeploymentData = React.lazy(() => import('./pages/BusinessIntelligence/components/deployments'));
const ReportsGenBI = React.lazy(() => import('./pages/BusinessIntelligence/components/reports'));
const DashboardReports = React.lazy(() => import('./pages/BusinessIntelligence/components/reports/dashboard'));
const Connect = React.lazy(() => import('./pages/BusinessIntelligence/components/components/connect'));
const MiddleContent = React.lazy(() => import('./pages/entryPage'));
const GenAi = React.lazy(() => import('./pages/genAi'));
const ForecastData = React.lazy(() => import('./pages/BusinessIntelligence/components/components/prediction/Forecast'));
const NewDeploymentData = React.lazy(() => import('./pages/BusinessIntelligence/components/deployments/newDeployment'));
const PredictionAndForecast = React.lazy(() => import('./pages/BusinessIntelligence/components/components/prediction'));
const Projects = React.lazy(() => import('./pages/projects'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/new-deployment" element={<NewDeploymentData />} />
          <Route path="/" element={<AdminLayout />}>
            <Route path='/welcome' Component={MiddleContent} />
            <Route path='/gen-dashboard' Component={DashboardReports} />
            <Route path='/review-report' element={<HtmlReport />} />
            <Route path='/gen-ai' element={<GenAi />} />
            <Route path='/projects' Component={Projects} />
            <Route path='/connect' Component={Connect} />
            <Route path='/discover' Component={DisplayData} />
            <Route path='/predict' Component={PredictionAndForecast} />
            <Route path='/forecast' Component={ForecastData} />
            <Route path='/reports' Component={ReportsGenBI} />
            <Route path='/data-source' element={<DataSource />} />
            <Route path='/deployment' Component={DeploymentData} />
            <Route path='/business-intelligence' element={<BusinessIntelligence />} />
            <Route path='/datasets' element={<Datasets />} />
          </Route>

          <Route path="/" element={<AdminLayout2 />}>
            <Route path='/settings/team/general' element={<GeneralTeam />} />
            <Route path='/settings/team/members' element={<MembersTeam />} />
            <Route path='/settings/team/api-keys' element={<ApiKeys />} />
            <Route path='/settings/organization/general' element={<GeneralOrganization />} />
            <Route path='/settings/organization/members' element={<MembersOrganization />} />
            <Route path='/settings/organization/usage' element={<Usage />} />
            <Route path='/settings/organization/billing' element={<Billing />} />
            <Route path='/settings/organization/whitelabeling' element={<WhiteLabeling />} />
            <Route path='/settings/account/notification' element={<Notification />} />
            <Route path='/settings/account/legal' element={<Legal />} />
            <Route path='/settings/account/general' element={<GeneralAccount />} />
          </Route>

          <Route path="/terms" element={<TermsConst />} />
          <Route path="/legal" element={<LegalConst />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
