import { useSearchParams } from 'react-router';

import { PageHeader } from '../components/Feedback.jsx';
import { Icon } from '../components/Icon.jsx';
import { TabPanel, Tabs } from '../components/Tabs.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle } from '../hooks/useCommon.js';
import { ActivityAdmin } from './admin/ActivityAdmin.jsx';
import { AnnouncementsAdmin } from './admin/AnnouncementsAdmin.jsx';
import { InventoryAdmin } from './admin/InventoryAdmin.jsx';
import { Overview } from './admin/Overview.jsx';
import { RESERVATION_FILTERS, ReservationsAdmin } from './admin/ReservationsAdmin.jsx';
import { RequestsBoard } from './admin/RequestsBoard.jsx';

/**
 * The staff console. The selected tab (and reservation filter) live in the
 * URL, e.g. /admin?tab=reservations&filter=overdue, so links from
 * notifications open the right view.
 */
export default function Admin() {
  useDocumentTitle('Staff console');
  const [params, setParams] = useSearchParams();
  const overview = useApi('/api/admin/overview');
  const kpis = overview.data?.kpis;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'chart' },
    { id: 'reservations', label: 'Reservations', icon: 'calendar', count: kpis?.pendingApprovals },
    { id: 'inventory', label: 'Inventory', icon: 'layers' },
    { id: 'requests', label: 'Requests', icon: 'clipboard', count: kpis?.openRequests },
    { id: 'announcements', label: 'Announcements', icon: 'megaphone' },
    { id: 'activity', label: 'Activity log', icon: 'history' },
  ];

  const tab = tabs.some((option) => option.id === params.get('tab')) ? params.get('tab') : 'overview';
  const filter = RESERVATION_FILTERS.some((option) => option.id === params.get('filter')) ? params.get('filter') : 'pending';

  function openTab(id, nextFilter) {
    const next = { tab: id };
    if (nextFilter) next.filter = nextFilter;
    setParams(next, { replace: true });
  }

  return (
    <>
      <PageHeader
        eyebrow="Staff console"
        title="Manage Commons"
        description="Approve reservations, check equipment in and out, respond to requests, and see how resources are used."
        actions={
          <a className="button button--secondary" href="/api/admin/export/reservations.csv" download>
            <Icon name="download" size={18} />
            Export reservations (CSV)
          </a>
        }
      />

      <div className="container section--tight admin">
        <Tabs tabs={tabs} active={tab} onChange={(id) => openTab(id)} label="Staff console sections" />

        <TabPanel id="overview" active={tab === 'overview'}>
          <Overview overview={overview} onOpenTab={openTab} />
        </TabPanel>
        <TabPanel id="reservations" active={tab === 'reservations'}>
          <ReservationsAdmin filter={filter} onFilterChange={(next) => openTab('reservations', next)} onChanged={overview.reload} />
        </TabPanel>
        <TabPanel id="inventory" active={tab === 'inventory'}>
          <InventoryAdmin onChanged={overview.reload} />
        </TabPanel>
        <TabPanel id="requests" active={tab === 'requests'}>
          <RequestsBoard onChanged={overview.reload} />
        </TabPanel>
        <TabPanel id="announcements" active={tab === 'announcements'}>
          <AnnouncementsAdmin />
        </TabPanel>
        <TabPanel id="activity" active={tab === 'activity'}>
          <ActivityAdmin />
        </TabPanel>
      </div>
    </>
  );
}
