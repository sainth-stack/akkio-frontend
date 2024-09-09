import './App.css';
import { AdminLayout } from './layout';
import { Login } from './pages/Auth/login';
import { Register } from './pages/Auth/register';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { BusinessIntelligence } from './pages/BusinessIntelligence';
import DisplayData from './pages/BusinessIntelligence/components/components/DisplayData'
import { HtmlReport } from './pages/Reports/generateHTMLfile';
import "./pages/BusinessIntelligence/components/styles/uploadData.scss"
import "./pages/BusinessIntelligence/components/styles/app.scss"
import "./pages/BusinessIntelligence/components/styles/navbar.scss"
import "./pages/BusinessIntelligence/components/styles/endpopup.scss"
import { DataSource } from './pages/BusinessIntelligence/components/components/DataSource';
import { Datasets } from './pages/BusinessIntelligence/components/datasets';
import { AdminLayout2 } from './layout/layout2';
import { GeneralTeam } from './pages/BusinessIntelligence/components/settings/components/team/general';
import { GeneralOrganization } from './pages/BusinessIntelligence/components/settings/components/organization/general';
import { GeneralAccount } from './pages/BusinessIntelligence/components/settings/components/account/general';
import { MembersTeam } from './pages/BusinessIntelligence/components/settings/components/team/members';
import { ApiKeys } from './pages/BusinessIntelligence/components/settings/components/team/api-keys';
import { Notification } from './pages/BusinessIntelligence/components/settings/components/account/notification';
import { Legal } from './pages/BusinessIntelligence/components/settings/components/account/legal';
import { MembersOrganization } from './pages/BusinessIntelligence/components/settings/components/organization/members';
import { WhiteLabeling } from './pages/BusinessIntelligence/components/settings/components/organization/white-labeling';
import { Billing } from './pages/BusinessIntelligence/components/settings/components/organization/billing';
import { Usage } from './pages/BusinessIntelligence/components/settings/components/organization/usage';
import { TermsConst } from './pages/BusinessIntelligence/components/settings/components/account/legal/terms';
import { LegalConst } from './pages/BusinessIntelligence/components/settings/components/account/legal/legal';
import { ReportsGenBI } from './pages/BusinessIntelligence/components/reports';
import { DashboardReports } from './pages/BusinessIntelligence/components/reports/dashboard';
import Connect from './pages/BusinessIntelligence/components/components/connect';
import MiddleContent from './pages/entryPage';
import GenAi from './pages/genAi';
import ForecastData from './pages/BusinessIntelligence/components/components/prediction/Forecast';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* <Route path="/new-deployment" element={<NewDeploymentData />} /> */}
        <Route path="/" element={<AdminLayout />}>
          <Route path='/welcome' Component={MiddleContent} />
          <Route path='/gen-dashboard' Component={DashboardReports} />
          <Route path='/review-report' element={<HtmlReport />} />
          <Route path='/gen-ai' element={<GenAi />} />
          <Route path='/connect' Component={Connect} />
          <Route path='/discover' Component={DisplayData} />
          {/* <Route path='/predict' Component={PredictionAndForecast} /> */}
          <Route path='/forecast' Component={ForecastData} />
          <Route path='/reports' Component={ReportsGenBI} />
          <Route path='/data-source' element={<DataSource />} />
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
    </BrowserRouter>
  );
}

export default App;
