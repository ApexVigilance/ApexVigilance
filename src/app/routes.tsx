
import React from 'react';
import { createHashRouter, Navigate } from 'react-router-dom';
import { ProtectedLayout } from './ProtectedLayout';
import { DashboardPage } from '../modules/dashboard/DashboardPage';
import { PersoneelPage } from '../modules/personeel/PersoneelPage';
import { PersoneelDetailPage } from '../modules/personeel/PersoneelDetailPage';
import { PersoneelPrintPage } from '../modules/personeel/PersoneelPrintPage';
import { PlanningPage } from '../modules/planning/PlanningPage';
import { ShiftDetailPage as PlanningShiftDetail } from '../modules/planning/ShiftDetailPage';
import { PlanningPrintPage } from '../modules/planning/PlanningPrintPage';
import { ShiftsPage } from '../modules/shifts/ShiftsPage';
import { ShiftDetailPage } from '../modules/shifts/ShiftDetailPage';
import { ShiftPrintPage } from '../modules/shifts/ShiftPrintPage';
import { TijdregistratiesPage } from '../modules/tijdregistraties/TijdregistratiesPage';
import { TijdregistratieDetailPage } from '../modules/tijdregistraties/TijdregistratieDetailPage';
import { TijdsregistratiesPrintPage } from '../modules/tijdregistraties/TijdsregistratiesPrintPage';
import { RapportenPage } from '../modules/rapporten/RapportenPage';
import { RapportDetailPage } from '../modules/rapporten/RapportDetailPage';
import { RapportPrintPage } from '../modules/rapporten/RapportPrintPage';
import { IncidentenPage } from '../modules/incidenten/IncidentenPage';
import { IncidentDetailPage } from '../modules/incidenten/IncidentDetailPage';
import { IncidentPrintPage } from '../modules/incidenten/IncidentPrintPage';
import { KlantenPage } from '../modules/klanten/KlantenPage';
import { KlantDetailPage } from '../modules/klanten/KlantDetailPage';
import { KlantenPrintPage } from '../modules/klanten/KlantenPrintPage';
import { LocatiesPage } from '../modules/klanten/LocatiesPage';
import { FacturatiePage } from '../modules/facturatie/FacturatiePage';
import { NieuweFacturatiePage } from '../modules/facturatie/NieuweFacturatiePage';
import { NieuweFactuurPage } from '../modules/facturatie/NieuweFactuurPage';
import { FacturenPage } from '../modules/facturatie/FacturenPage';
import { InvoiceDetailPage } from '../modules/facturatie/InvoiceDetailPage';
import { ExportPage } from '../modules/facturatie/ExportPage';
import { SettingsPage } from '../modules/settings/SettingsPage';

// Registration
import { RegistratiePage } from '../modules/registratie/RegistratiePage';
import { RegistratiesPage } from '../modules/registraties/RegistratiesPage';

// Auth Modules
import { LoginPage } from '../modules/auth/LoginPage';
import { RoleGuard } from '../modules/auth/RoleGuard';
import { AgentLayout } from '../modules/agent/AgentLayout';

// Client portal
import { ClientLayout } from '../modules/client/ClientLayout';
import { ClientDashboardPage } from '../modules/client/ClientDashboardPage';
import { ClientAanvragenPage } from '../modules/client/ClientAanvragenPage';
import { ClientShiftsPage } from '../modules/client/ClientShiftsPage';
import { ClientFacturenPage } from '../modules/client/ClientFacturenPage';
import { ClientIncidentenPage } from '../modules/client/ClientIncidentenPage';
import { ClientProfielPage } from '../modules/client/ClientProfielPage';
import { AgentDashboardPage } from '../modules/agent/dashboard/AgentDashboardPage';
import { AgentShiftsPage } from '../modules/agent/shifts/AgentShiftsPage';
import { AgentShiftDetailPage } from '../modules/agent/shifts/AgentShiftDetailPage';
import { AgentTijdregistratiePage } from '../modules/agent/tijdregistraties/AgentTijdregistratiePage';
import { AgentRapportenPage } from '../modules/agent/rapporten/AgentRapportenPage';
import { AgentIncidentenPage } from '../modules/agent/incidenten/AgentIncidentenPage';
import { AgentProfielPage } from '../modules/agent/profiel/AgentProfielPage';

export const router = createHashRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/registreer',
    element: <RegistratiePage />
  },
  {
    path: '/',
    element: (
      <RoleGuard requiredRole="admin">
        <ProtectedLayout />
      </RoleGuard>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'personeel', element: <PersoneelPage /> },
      { path: 'personeel/:id', element: <PersoneelDetailPage /> },
      { path: 'planning', element: <PlanningPage /> },
      { path: 'planning/:id', element: <PlanningShiftDetail /> },
      { path: 'shifts', element: <ShiftsPage /> },
      { path: 'shifts/:id', element: <ShiftDetailPage /> },
      { path: 'shifts/:id/print', element: <ShiftPrintPage /> },
      { path: 'tijdregistraties', element: <TijdregistratiesPage /> },
      { path: 'tijdregistraties/:id', element: <TijdregistratieDetailPage /> },
      { path: 'rapporten', element: <RapportenPage /> },
      { path: 'rapporten/:id', element: <RapportDetailPage /> },
      { path: 'incidenten', element: <IncidentenPage /> },
      { path: 'incidenten/:id', element: <IncidentDetailPage /> },
      { path: 'klanten', element: <KlantenPage /> },
      { path: 'klanten/:id', element: <KlantDetailPage /> },
      { path: 'klanten/locaties', element: <LocatiesPage /> },
      { path: 'facturatie', element: <FacturatiePage /> },
      { path: 'facturatie/nieuw', element: <NieuweFactuurPage /> },
      { path: 'facturatie/ronde', element: <NieuweFacturatiePage /> },
      { path: 'facturatie/facturen', element: <FacturenPage /> },
      { path: 'facturatie/factuur/:invoiceId', element: <InvoiceDetailPage /> },
      { path: 'facturatie/export', element: <ExportPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'registraties', element: <RegistratiesPage /> },
    ]
  },
  {
    path: '/agent',
    element: (
      <RoleGuard requiredRole="agent">
        <AgentLayout />
      </RoleGuard>
    ),
    children: [
      { index: true, element: <AgentDashboardPage /> },
      { path: 'shifts', element: <AgentShiftsPage /> },
      { path: 'shifts/:id', element: <AgentShiftDetailPage /> },
      { path: 'tijdregistratie', element: <AgentTijdregistratiePage /> },
      { path: 'rapporten', element: <AgentRapportenPage /> },
      { path: 'incidenten', element: <AgentIncidentenPage /> },
      { path: 'profiel', element: <AgentProfielPage /> },
    ]
  },
  {
    path: '/client',
    element: (
      <RoleGuard requiredRole="client">
        <ClientLayout />
      </RoleGuard>
    ),
    children: [
      { index: true, element: <ClientDashboardPage /> },
      { path: 'aanvragen', element: <ClientAanvragenPage /> },
      { path: 'shifts', element: <ClientShiftsPage /> },
      { path: 'facturen', element: <ClientFacturenPage /> },
      { path: 'incidenten', element: <ClientIncidentenPage /> },
      { path: 'profiel', element: <ClientProfielPage /> },
    ]
  },
  { path: '/incidenten/:id/print', element: <IncidentPrintPage /> },
  { path: '/rapporten/:id/print', element: <RapportPrintPage /> },
  { path: '/personeel/:id/print', element: <PersoneelPrintPage /> },
  { path: '/tijdregistraties/print', element: <TijdsregistratiesPrintPage /> },
  { path: '/planning/print', element: <PlanningPrintPage /> },
  { path: '/klanten/print', element: <KlantenPrintPage /> },
  { path: '*', element: <Navigate to="/login" replace /> }
]);
