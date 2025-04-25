import React, { useState, useEffect } from 'react';
import {
  Route,
  Routes,
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  Layout,
  theme,
  Button,
  Menu,
  Dropdown,
  Badge,
  Tabs,
  Typography,
  Tag,
} from 'antd';
import { FaAngleLeft, FaAngleRight, FaUserShield, FaPeopleRoof } from 'react-icons/fa6';
import { IoNotificationsCircle, IoSettingsOutline } from 'react-icons/io5';
import { MdAdminPanelSettings } from 'react-icons/md';
import { RxDashboard } from 'react-icons/rx';
import { RiHomeOfficeLine } from 'react-icons/ri';
import { TbZoomMoney } from 'react-icons/tb';
import { GrHostMaintenance } from 'react-icons/gr';
import { LuUtilityPole } from 'react-icons/lu';
import { HiOutlineDocumentReport } from 'react-icons/hi';
import { WarningOutlined, CloseOutlined } from '@ant-design/icons';

import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Users from './pages/users/Users';
import PageNotFound from './pages/PageNotFound';
import NewUserForm from './components/forms/users/NewUserForm';
import ModalForm from './modal/Modal';
import ChangePasswordForm from './components/forms/users/ChangePasswordForm';
import Tenants from './pages/Tenants/Tenants';
import StallManagement from './pages/Stall Management/StallManagement';
import LeaseAgreements from './pages/Lease Agreements/LeaseAgreements ';
import MaintenanceRequests from './pages/Maintenance Requests/MaintenanceRequests';
import RemindersAndNotifications from './pages/Reminder And Notification/RemindersAndNotifications';
import logo from './assets/imgs/logo.png';
import Termination from './pages/termination/Termination';
import Utility from './pages/Utility/Utility';
import TenantInfo from './components/TenantsInfo/TenantInfo';
import RentInfo from './components/Rent/RentInfo';
import TabComponent from './components/tabs/TabComponent';
import ReportPage from './pages/report/ReportPage';
import { useAuth } from './context/AuthContext';

const { Header, Content, Sider } = Layout;
const { Title: TypographyTitle } = Typography;

/*  
  Helper: parseDate  
  In case API dates come in with a space instead of "T"  
*/
const parseDate = (dateStr) => {
  return dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr.replace(' ', 'T'));
};

/*  
  Local Storage helpers to persist "read" and "dismissed" notification IDs  
*/
const getReadIds = () => JSON.parse(localStorage.getItem('readNotifications') || '[]');
const setReadIds = (ids) => localStorage.setItem('readNotifications', JSON.stringify(ids));

const getDismissedIds = () => JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
const setDismissedIds = (ids) => localStorage.setItem('dismissedNotifications', JSON.stringify(ids));

/*  
  Priority Colors: Red = High, Orange = Medium, Green = Low  
*/
const priorityColors = {
  High: 'red',
  Medium: 'orange',
  Low: 'green',
};

const App = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const [collapsed, setCollapsed] = useState(false);
  const {
    role,
    account,
    accountType,
    authLoading,
    logout,
    isLoggingOut,
    buildingName,
    buildingId,
  } = useAuth();

  const dynamicBuildingId = buildingId || 1;
  const navigate = useNavigate();
  const location = useLocation();

  const owner = accountType === "owner" ? account : null;
  const user = accountType === "user" ? account : null;

  // State to hold notifications
  const [alerts, setAlerts] = useState([]);
  const [stateOpenKeys, setStateOpenKeys] = useState();
  // Fetch notifications from tenants, rent, and utilities endpoints.
  useEffect(() => {
    if (dynamicBuildingId) {
      const fetchNotifications = async () => {
        try {
          const [tenantsResponse, rentsResponse, utilitiesResponse] = await Promise.all([
            fetch('http://localhost:5000/api/tenants'),
            fetch('http://localhost:5000/api/rent'),
            fetch('http://localhost:5000/api/utilities/tenant_utility_usage'),
          ]);
          const [tenants, rents, utilities] = await Promise.all([
            tenantsResponse.json(),
            rentsResponse.json(),
            utilitiesResponse.json(),
          ]);

          // Filter records based on buildingId
          const filteredTenants = tenants.filter(t => +t.building_id === +dynamicBuildingId);
          const filteredRents = rents.filter(r => +r.building_id === +dynamicBuildingId);
          const filteredUtilities = utilities.filter(u => +u.building_id === +dynamicBuildingId);

          const now = new Date();
          let notifications = [];

          /* Lease End Notification (High Priority)
             Notify if current date is at or past two months before lease end */
          filteredTenants.forEach((tenant) => {
            const leaseEnd = new Date(tenant.lease_end);
            const twoMonthsBefore = new Date(leaseEnd);
            twoMonthsBefore.setMonth(twoMonthsBefore.getMonth() - 2);
            if (now >= twoMonthsBefore && now < leaseEnd) {
              notifications.push({
                id: `lease-${tenant.tenant_id}`,
                type: 'lease',
                title: 'Lease End Approaching',
                message: `Lease for ${tenant.full_name} (ID: ${tenant.tenant_id}) expires on ${leaseEnd.toLocaleDateString()}.`,
                timestamp: now.toISOString(),
                read: false,
                priority: 'High',
              });
            }
          });

          /* Rent Notifications:
             - If payment is pending and a proof link exists, notify "Payment Proof Received" to approve.
             - Otherwise if pending and due date is within 3 days, notify "Rent Payment Due".
             - If paid, notify with details whether online (if proof text equals "chapa") or manually approved.
          */
          filteredRents.forEach((rent) => {
            const dueDate = parseDate(rent.due_date);
            const daysDifference = (dueDate - now) / (1000 * 3600 * 24);
            if (rent.payment_status === 'pending') {
              if (rent.payment_proof_url && rent.payment_proof_url.trim() !== "") {
                notifications.push({
                  id: `rent-proof-${rent.id}`,
                  type: 'rent-proof',
                  title: 'Payment Proof Received',
                  message: `Tenant ${rent.tenant_id} has submitted payment proof for rent. Approval pending.`,
                  timestamp: now.toISOString(),
                  read: false,
                  priority: 'High',
                });
              } else if (daysDifference <= 3 && daysDifference >= 0) {
                notifications.push({
                  id: `rent-due-${rent.id}`,
                  type: 'rent',
                  title: 'Rent Payment Due',
                  message: `Rent for tenant ${rent.tenant_id} is due on ${dueDate.toLocaleDateString()}.`,
                  timestamp: now.toISOString(),
                  read: false,
                  priority: 'High',
                });
              }
            } else if (rent.payment_status === 'paid') {
              const paymentMethod =
                rent.payment_proof_url &&
                rent.payment_proof_url.toLowerCase() === 'chapa'
                  ? 'online'
                  : 'manually approved';
              notifications.push({
                id: `rent-paid-${rent.id}`,
                type: 'payment',
                title: 'Payment Received',
                message: `Rent for tenant ${rent.tenant_id} processed (${paymentMethod}).`,
                timestamp: now.toISOString(),
                read: false,
                paymentMethod,
                priority: paymentMethod === 'online' ? 'Low' : 'Medium',
              });
            }
          });

          /* Utility Notifications:
             For records with "Bill Generated":
             - If a payment proof link is submitted, notify that proof has been received and approval is pending.
             - Otherwise, if due within 5 days, notify "Utility Bill Due".  */
          filteredUtilities.forEach((util) => {
            if (util.utility_status === "Bill Generated") {
              const utilDueDate = parseDate(util.due_date);
              const daysDiffUtil = (utilDueDate - now) / (1000 * 3600 * 24);
              if (util.payment_proof_link && util.payment_proof_link.trim() !== "") {
                notifications.push({
                  id: `utility-proof-${util.id}`,
                  type: 'utility-proof',
                  title: `Utility Payment Proof Received (${util.utility_type})`,
                  message: `Tenant ${util.tenant_id} has submitted payment proof for the utility bill. Approval pending.`,
                  timestamp: now.toISOString(),
                  read: false,
                  priority: 'High',
                });
              } else if (daysDiffUtil <= 5 && daysDiffUtil >= 0) {
                notifications.push({
                  id: `utility-${util.id}`,
                  type: 'utility',
                  title: `Utility Bill (${util.utility_type}) Due`,
                  message: `Utility bill for tenant ${util.tenant_id} is due on ${utilDueDate.toLocaleDateString()}. Amount: ${util.cost}.`,
                  timestamp: now.toISOString(),
                  read: false,
                  priority: 'Medium',
                });
              }
            }
          });

          // Get persisted read/dismissed notification IDs from localStorage.
          const readIds = getReadIds();
          const dismissedIds = getDismissedIds();

          notifications = notifications
            .filter(n => !dismissedIds.includes(n.id))
            .map(n => (readIds.includes(n.id) ? { ...n, read: true } : n));

          setAlerts(notifications);
        } catch (err) {
          console.error('Error fetching notifications', err);
        }
      };

      fetchNotifications();
    }
  }, [dynamicBuildingId]);

  const unreadCount = alerts.filter(alert => !alert.read).length;

  // Mark a single alert as read.
  const markAlertAsRead = (id) => {
    const updatedAlerts = alerts.map(alert =>
      alert.id === id ? { ...alert, read: true } : alert
    );
    setAlerts(updatedAlerts);
    const readIds = getReadIds();
    if (!readIds.includes(id)) {
      setReadIds([...readIds, id]);
    }
  };

  // Mark all alerts as read.
  const handleMarkAllAsRead = () => {
    const updatedAlerts = alerts.map(a => ({ ...a, read: true }));
    setAlerts(updatedAlerts);
    const allIds = updatedAlerts.map(a => a.id);
    setReadIds(allIds);
  };

  // Dismiss an individual alert.
  const dismissAlert = (id) => {
    const updatedAlerts = alerts.filter(a => a.id !== id);
    setAlerts(updatedAlerts);
    const dismissed = getDismissedIds();
    if (!dismissed.includes(id)) {
      setDismissedIds([...dismissed, id]);
    }
  };

  // Dismiss all alerts.
  const handleDismissAll = () => {
    const allIds = alerts.map(a => a.id);
    setAlerts([]);
    const dismissed = getDismissedIds();
    setDismissedIds(Array.from(new Set([...dismissed, ...allIds])));
  };

  // Render a single alert item.
  const renderAlertItem = (alert) => (
    <div
      key={alert.id}
      style={{
        padding: '10px',
        borderBottom: '1px solid #eee',
        backgroundColor: alert.read ? '#fff' : '#f0f2f5',
        position: 'relative',
        cursor: 'pointer',
      }}
      onClick={() => markAlertAsRead(alert.id)}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {!alert.read && <WarningOutlined style={{ color: 'red', marginRight: 5 }} />}
        <Typography.Text strong>{alert.title}</Typography.Text>
        {alert.type === 'payment' && (
          <Typography.Text style={{ marginLeft: 5, color: 'orange' }}>
            {alert.paymentMethod === 'online' ? ' (online)' : ' (manually approved)'}
          </Typography.Text>
        )}
        <Tag style={{ marginLeft: 'auto' }} color={priorityColors[alert.priority]}>
          {alert.priority}
        </Tag>
        <CloseOutlined
          style={{ marginLeft: 10, color: '#888' }}
          onClick={(e) => { e.stopPropagation(); dismissAlert(alert.id); }}
        />
      </div>
      <div>
        <Typography.Text type="secondary" style={{ fontSize: '0.9em' }}>
          {alert.message}
        </Typography.Text>
      </div>
      <div>
        <Typography.Text type="secondary" style={{ fontSize: '0.8em' }}>
          {new Date(alert.timestamp).toLocaleString()}
        </Typography.Text>
      </div>
    </div>
  );

  // Notifications panel dropdown content.
  const notificationsPanel = (
    <div style={{ width: '350px', maxHeight: '450px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #eee' }}>
        <Button size="small" onClick={handleMarkAllAsRead}>Mark All as Read</Button>
        <Button size="small" danger onClick={handleDismissAll}>Dismiss All</Button>
      </div>
      <Tabs defaultActiveKey="1" style={{ flex: 1, overflowY: 'auto' }}>
        <Tabs.TabPane tab="Alerts" key="1">
          {alerts.filter(a => !a.read).length ? (
            alerts.filter(a => !a.read).map(renderAlertItem)
          ) : (
            <div style={{ padding: '10px', textAlign: 'center', color: '#999' }}>No new alerts</div>
          )}
        </Tabs.TabPane>
        <Tabs.TabPane tab="Inbox" key="2">
          {alerts.length ? (
            alerts.map(renderAlertItem)
          ) : (
            <div style={{ padding: '10px', textAlign: 'center', color: '#999' }}>No alerts</div>
          )}
        </Tabs.TabPane>
      </Tabs>
    </div>
  );

  // Redirect unauthenticated users.
  useEffect(() => {
    if (!authLoading && !owner && !user && location.pathname !== "/") {
      navigate("/");
    }
  }, [authLoading, owner, user, navigate, location.pathname]);

  // Determine the current page title based on the URL path.
  const pathName = useLocation().pathname;
  const paths = pathName.split('/').filter((path) => path);
  let pageTitle = 'Dashboard';
  if (paths.length > 0) {
    pageTitle = paths[0].charAt(0).toUpperCase() + paths[0].slice(1);
    if (paths[0] === 'rent-info') pageTitle = 'Payments';
    if (paths[0] === 'stall-management') pageTitle = 'Stall Management';
    if (paths[0] === 'maintenance-requests') pageTitle = 'Maintenance Requests';
    if (paths[0] === 'reminders-notifications') pageTitle = 'Notifications';
    if (paths[0] === 'users') pageTitle = 'Users';
    if (paths[0] === 'utility') pageTitle = 'Utility';
    if (paths[0] === 'reports') pageTitle = 'Reports';
  }

  const [openValue, setOpenValue] = useState(false);
  const [openTitle, setTitle] = useState(false);
  const [openContent, setOpenContent] = useState();

  if (authLoading) {
    return <div>Loading...</div>;
  }
  if (!owner && !user && location.pathname !== "/") {
    return <Auth />;
  }

  return (
    <div>
      <Layout style={{ height: '100vh' }}>
        <ModalForm
          open={openValue}
          close={() => setOpenValue(false)}
          content={openContent}
          title={openTitle}
        />
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          theme="light"
          style={{ overflow: 'auto', height: '100vh' }}
        >
          <div style={{
            width: '100%',
            height: '70px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}>
            <img src={logo} alt="logo" style={{ width: 'auto', height: '100%', objectFit: 'contain' }} />
          </div>
          <Menu
            theme="light"
            mode="inline"
            items={[
              {
                key: '1',
                label: <Link to={'/dashboard'}>Dashboard</Link>,
                icon: <RxDashboard size={20} />,
              },
              {
                key: '2',
                label: role === "maintenance"
                  ? "Maintenance Dashboard"
                  : role === "finance"
                    ? "Finance Dashboard"
                    : "Owner Dashboard",
                icon: <MdAdminPanelSettings size={20} />,
                children: role === "maintenance"
                  ? [{
                      key: '6',
                      label: (
                        <Link to={'/maintenance-requests'}>
                          <GrHostMaintenance /> Maintenance Requests
                        </Link>
                      ),
                    }]
                  : [
                      { key: '1', label: (<Link to={'/tenants'}><FaPeopleRoof /> Tenants</Link>) },
                      { key: '3', label: (<Link to={'/stall-management'}><RiHomeOfficeLine /> Stall Management</Link>) },
                      { key: '4', label: (<Link to={'/payments'}><TbZoomMoney /> Payments</Link>) },
                      { key: '5', label: (<Link to={'/maintenance-requests'}><GrHostMaintenance /> Maintenance Requests</Link>) },
                      { key: '6', label: (<Link to={'/reports'}><HiOutlineDocumentReport /> Reports</Link>) },
                    ],
              },
              ...(owner ? [{
                key: "/users",
                label: <Link to="/users/list">Users</Link>,
                icon: <FaUserShield size={20} />,
              }] : []),
            ]}
          />
          <div style={{ marginTop: 'auto' }}>
            {role === "finance" && (
              <Menu>
                <Menu.Item key="/utility" icon={<LuUtilityPole size={20} />}>
                  <Link to="/utility/list">Utility</Link>
                </Menu.Item>
              </Menu>
            )}
          </div>
        </Sider>

        <Layout>
          <Header style={{
            padding: '0 16px',
            background: colorBgContainer,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexShrink: 0,
              minWidth: '200px',
            }}>
              <Button
                type="text"
                icon={collapsed ? <FaAngleRight /> : <FaAngleLeft />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: '16px', width: 30, height: 64 }}
              />
              <Typography.Text
                strong
                style={{
                  fontSize: '16px',
                  background: 'linear-gradient(90deg, #ff6ec4, #7873f5, #4ade80)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                }}
              >
                {pageTitle}
              </Typography.Text>
            </div>
            <div style={{
              position: 'absolute',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{
                maxWidth: '80%',
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                <TypographyTitle
                  level={4}
                  style={{
                    margin: 0,
                    background: 'linear-gradient(90deg, #ff6ec4, #7873f5, #4ade80)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 'bold',
                    fontSize: '1.3rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    pointerEvents: 'auto',
                  }}
                >
                  {buildingName || 'BUILDING NAME'}
                </TypographyTitle>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              flexShrink: 0,
              minWidth: '150px',
              justifyContent: 'flex-end',
            }}>
              <Dropdown dropdownRender={() => notificationsPanel} trigger={['click']}>
                <Badge size="small" count={unreadCount}>
                  <IoNotificationsCircle size={26} cursor="pointer" />
                </Badge>
              </Dropdown>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: '1',
                      label: (
                        <span
                          onClick={() => {
                            setOpenValue(true);
                            setOpenContent(<ChangePasswordForm openModalFun={() => setOpenValue(false)} />);
                            setTitle('Change Password');
                          }}
                        >
                          Change Password
                        </span>
                      ),
                    },
                    {
                      key: '2',
                      label: (
                        <span
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            cursor: isLoggingOut ? "not-allowed" : "pointer",
                            opacity: isLoggingOut ? 0.5 : 1,
                            transition: "opacity 0.2s ease-in-out",
                          }}
                          onClick={logout}
                        >
                          Logout
                        </span>
                      ),
                    },
                  ],
                }}
                placement="bottomRight"
                trigger={['click']}
              >
                <IoSettingsOutline size={22} cursor="pointer" />
              </Dropdown>
            </div>
          </Header>

          <Content style={{
            margin: '16px 8px 0',
            overflow: 'auto',
          }}>
            <div style={{
              padding: 8,
              minHeight: 'calc(100vh - 112px)',
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}>
              <Routes>
                <Route element={<Auth />} path="/" />
                {(owner || user) && (
                  <>
                    <Route element={<Dashboard />} path="/dashboard" />
                    <Route element={<Users />} path="/users/list" />
                    <Route element={<Tenants />} path="/tenants" />
                    <Route element={<StallManagement />} path="/stall-management" />
                    <Route element={<LeaseAgreements />} path="/lease-agreements" />
                    <Route element={<TabComponent />} path="/payments" />
                    <Route element={<MaintenanceRequests />} path="/maintenance-requests" />
                    <Route element={<RemindersAndNotifications />} path="/reminders-notifications" />
                    <Route element={<Termination />} path="/termination" />
                    <Route path="/tenants/:id" element={<TenantInfo />} />
                    <Route element={<Utility />} path="/utility/list" />
                    <Route element={<ReportPage />} path="/reports" />
                    <Route path="/rent-info/:billId" element={<RentInfo />} />
                  </>
                )}
                <Route element={<PageNotFound />} path="*" />
              </Routes>
            </div>
          </Content>
        </Layout>
      </Layout>
    </div>
  );
};

export default App;
