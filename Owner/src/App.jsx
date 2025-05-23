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
    // Breadcrumb is no longer used in the Header, but keep if used elsewhere
    Button,
    Menu,
    Dropdown,
    Badge,
    Tabs,
    Typography, // Import Typography for Title and Text
} from 'antd';
import {
    FaAngleLeft,
    FaAngleRight,
    FaUserShield,
} from 'react-icons/fa6';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Users from './pages/users/Users';
import PageNotFound from './pages/PageNotFound';
import {
    IoNotificationsCircle,
    IoSettingsOutline,
} from 'react-icons/io5';
import NewUserForm from './components/forms/users/NewUserForm';
import ModalForm from './modal/Modal';
import ChangePasswordForm from './components/forms/users/ChangePasswordForm';
import { MdAdminPanelSettings } from 'react-icons/md';
import { FaRegNewspaper } from 'react-icons/fa6';
import { RxDashboard } from 'react-icons/rx';
import Tenants from './pages/Tenants/Tenants';
import StallManagement from './pages/Stall Management/StallManagement';
import LeaseAgreements from './pages/Lease Agreements/LeaseAgreements '; // Corrected Import
import MaintenanceRequests from './pages/Maintenance Requests/MaintenanceRequests';
import RemindersAndNotifications from './pages/Reminder And Notification/RemindersAndNotifications';
import logo from './assets/imgs/logo.png';
import Termination from './pages/termination/Termination';
import { FaPeopleRoof } from 'react-icons/fa6';
import { RiHomeOfficeLine } from 'react-icons/ri';
import { TbZoomMoney } from 'react-icons/tb';
import { GrHostMaintenance } from 'react-icons/gr'; // Assuming this import is correct
import { IoNotifications } from 'react-icons/io5';
import { LuUtilityPole } from 'react-icons/lu';
import Utility from './pages/Utility/Utility';
import TenantInfo from './components/TenantsInfo/TenantInfo';
import RentInfo from './components/Rent/RentInfo';
import TabComponent from './components/tabs/TabComponent';
import { useAuth } from './context/AuthContext'; // Import useAuth
import { HiOutlineDocumentReport } from "react-icons/hi";
import ReportPage from './pages/report/ReportPage';

const { Header, Content, Sider } = Layout;
const { Title: TypographyTitle, Text } = Typography; // Alias Title and import Text

const App = () => {

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();
    const [collapsed, setCollapsed] = useState(false);
    // Access buildingName directly from useAuth as you've added it there
    const { role, account, accountType, authLoading, logout, isLoggingOut, buildingName } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();

    const owner = accountType === "owner" ? account : null;
    const user = accountType === "user" ? account : null

    // useEffect hook handles navigation based on auth state
    useEffect(() => {
        if (!authLoading && !owner && !user && location.pathname !== "/") {
            navigate("/");
        }
    }, [authLoading, owner, user, navigate, location.pathname]);


    const items = [
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
            children:
                role === "maintenance"
                    ? [
                        {
                            key: '6',
                            label: (
                                <Link to={'/maintenance-requests'}>
                                    <GrHostMaintenance /> Maintenance Requests
                                </Link>
                            ),
                        },
                    ]
                    : [
                        {
                            key: '1',
                            label: (
                                <Link to={'/tenants'}>
                                    <FaPeopleRoof /> Tenants
                                </Link>
                            ),
                        },
                        {
                            key: '3',
                            label: (
                                <Link to={'/stall-management'}>
                                    <RiHomeOfficeLine /> Stall Management
                                </Link>
                            ),
                        },
                        {
                            key: '4',
                            label: (
                                <Link to={'/payments'}>
                                    <TbZoomMoney /> Payments
                                </Link>
                            ),
                        },
                        {
                            key: '5',
                            label: (
                                <Link to={'/maintenance-requests'}>
                                    <GrHostMaintenance /> Maintenance Requests
                                </Link>
                            ),
                        },
                        {
                            key: '6',
                            label: (
                                <Link to={'/reports'}>
                                    <HiOutlineDocumentReport /> Reports
                                </Link>
                            ),
                        },
                    ],
        },
        ...(owner
            ? [
                {
                    key: "/users",
                    label: <Link to="/users/list">Users</Link>,
                    icon: <FaUserShield size={20} />,
                },
            ]
            : []),
    ];
    const getLevelKeys = (items1) => {
        const key = {};
        const func = (items2, level = 1) => {
            items2.forEach((item) => {
                if (item.key) {
                    key[item.key] = level;
                }
                if (item.children) {
                    func(item.children, level + 1);
                }
            });
        };
        func(items1);
        return key;
    };
    const levelKeys = getLevelKeys(items);

    const [stateOpenKeys, setStateOpenKeys] = useState();
    const onOpenChange = (openKeys) => {
        const currentOpenKey = openKeys.find(
            (key) => stateOpenKeys.indexOf(key) === -1
        );
        if (currentOpenKey !== undefined) {
            const repeatIndex = openKeys
                .filter((key) => key !== currentOpenKey)
                .findIndex((key) => levelKeys[key] === levelKeys[currentOpenKey]);
            setStateOpenKeys(
                openKeys
                    .filter((_, index) => index !== repeatIndex)
                    .filter((key) => levelKeys[key] <= levelKeys[currentOpenKey])
            );
        } else {
            setStateOpenKeys(openKeys);
        }
    };

    // Logic to determine the current page title based on the path
    const pathName = useLocation().pathname;
    const paths = pathName.split('/').filter((path) => path);

    let pageTitle = 'Dashboard'; // Default title for '/'
    if (paths.length > 0) {
        // Use the first path segment, capitalize it
        let firstSegment = paths[0].charAt(0).toUpperCase() + paths[0].slice(1);
        pageTitle = firstSegment; // Use the first segment as the default title

        // You can add specific overrides for multi-segment paths if needed,
        // though usually the first segment is sufficient for a main section title.
        // Example: If you wanted '/users/list' to show 'Users List' instead of 'Users':
        // if (paths[0] === 'users' && paths[1] === 'list') pageTitle = 'Users List';
        // For tenant details '/tenants/:id', the first segment 'tenants' is still the relevant section title.
        // Same for '/rent-info/:billId', 'rent-info' -> 'Rent-info' (or maybe 'Payments' depending on preference)
        if (paths[0] === 'rent-info') pageTitle = 'Payments'; // Example override
        if (paths[0] === 'stall-management') pageTitle = 'Stall Management';
        if (paths[0] === 'maintenance-requests') pageTitle = 'Maintenance Requests';
        if (paths[0] === 'reminders-notifications') pageTitle = 'Notifications'; // Shorter name
        if (paths[0] === 'users') pageTitle = 'Users';
        if (paths[0] === 'utility') pageTitle = 'Utility';
         if (paths[0] === 'reports') pageTitle = 'Reports';


    }


    const [openValue, setOpenValue] = useState(false);
    const [openTitle, setTitle] = useState(false);
    const [openContent, setOpenContent] = useState();

    const tabs = [
        {
            key: '1',
            label: 'Alert',
            children: <span>Alert</span>,
        },
        {
            key: '2',
            label: 'Inbox',
            children: <span>Inbox</span>,
        },
        {
            key: '3',
            label: 'Sent',
            children: <span>Sent</span>,
        },
        {
            key: '4',
            label: 'Draft',
            children: <span>Draft</span>,
        },
    ];

    const items1 = [
        {
            key: '1',
            label: (
                <span
                    style={{ width: '100%', display: 'flex', alignItems: 'center' }}
                    onClick={() => {
                        setOpenValue(true);
                        setOpenContent(<NewUserForm />); // Or a specific Profile form
                        setTitle('Profile');
                    }}
                >
                    Profile
                </span>
            ),
        },
        {
            key: '2',
            label: (
                <span
                    onClick={() => {
                        setOpenValue(true);
                        setOpenContent(<ChangePasswordForm />);
                        setTitle('Change Password');
                    }}
                >
                    Change Password
                </span>
            ),
        },
        {
            key: '3',
            label: (
                <span
                    style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        cursor: isLoggingOut ? "not-allowed" : "pointer",
                        opacity: isLoggingOut ? 0.5 : 1,
                        transition: "opacity 0.2s ease-in-out"
                    }}
                    onClick={logout}
                >
                    Logout
                </span>
            ),
        },
    ];

    const items2 = [
        {
            key: '4',
            label: (
                <Tabs
                    defaultActiveKey="1"
                    items={tabs} // Removed condition based on paths
                    style={{ width: '350px', height: '450px' }}
                    onChange={(c) => !c}
                />
            ),
        },
    ];
    const [visible, setVisible] = useState(false);


    if (authLoading) {
        return <div>Loading...</div>;
    }

    // Redirect unauthenticated users to login, except for the login page itself
    if (!owner && !user && location.pathname !== "/") {
         return <Auth />; // Or a loading/redirecting message
    }


    return (
        <div>
            <Layout style={{ height: '100vh' }}>
                {/* ModalForm and Sider remain here */}
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
                     {/* Logo and Menu */}
                    <div
                        style={{
                            width: '100%',
                            height: '70px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                        }}
                    >
                        <img
                            src={logo}
                            alt="logo"
                            style={{ width: 'auto', height: '100%', objectFit: 'contain' }}
                        />
                    </div>
                    <Menu
                        openKeys={stateOpenKeys}
                        onOpenChange={onOpenChange}
                        theme="light"
                        style={{ width: '100%', borderRight: 0 }}
                        mode="inline"
                        items={items}
                    />
                    <div style={{ marginTop: 'auto' }}>
                        {
                            role === "finance" ?
                                (<Menu>
                                    <Menu.Item key="/utility" icon={<LuUtilityPole size={20} />}>
                                        <Link to="/utility/list">Utility</Link>
                                    </Menu.Item>
                                </Menu>)
                                : null}
                    </div>
                </Sider>

                <Layout>
                    {/* MODIFIED HEADER SECTION */}
                    <Header
  style={{
    padding: '0 16px',
    background: colorBgContainer,
    position: 'relative', // Required for absolute positioning center
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }}
>
  {/* Left Section */}
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      flexShrink: 0,
      minWidth: '200px', // Fixed width to avoid pushing center
    }}
  >
    <Button
      type="text"
      icon={collapsed ? <FaAngleRight /> : <FaAngleLeft />}
      onClick={() => setCollapsed(!collapsed)}
      style={{
        fontSize: '16px',
        width: 30,
        height: 64,
      }}
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

  {/* Center Section: Absolutely Centered Title */}
  <div style={{ 
  position: 'absolute',
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  pointerEvents: 'none', // lets clicks go to left/right elements
}}>
  <div style={{ 
    maxWidth: '80%', // adapt to screen, but keep it from stretching too far
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
        pointerEvents: 'auto', // re-enable interactions here
      }}
    >
      {buildingName || 'BUILDING NAME'}
    </TypographyTitle>
  </div>
</div>


  {/* Right Section */}
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      flexShrink: 0,
      minWidth: '150px', // Match to avoid pushing
      justifyContent: 'flex-end',
    }}
  >
    <Dropdown
      visible={visible}
      onVisibleChange={(v) => setVisible(v)}
      menu={{
        items: items2,
        onClick: () => setVisible(true),
      }}
      placement="bottomRight"
      trigger={['click']}
    >
      <Badge size="small" count={0}>
        <IoNotificationsCircle size={26} cursor="pointer" />
      </Badge>
    </Dropdown>
    <Dropdown
      menu={{ items: items1 }}
      placement="bottomRight"
      trigger={['click']}
    >
      <IoSettingsOutline size={22} cursor="pointer" />
    </Dropdown>
  </div>
</Header>

                    {/* END OF MODIFIED HEADER SECTION */}

                    <Content
                        style={{
                            margin: '16px 8px 0',
                            overflow: 'auto',
                        }}
                    >
                         {/* Routes */}
                        <div
                            style={{
                                padding: 8,
                                minHeight: 'calc(100vh - 112px)',
                                background: colorBgContainer,
                                borderRadius: borderRadiusLG,
                            }}
                        >
                            <Routes>
                                <Route element={<Auth />} path="/" />
                                {owner || user ? (
                                    <>
                                        <Route element={<Dashboard />} path="/dashboard" />
                                        <Route element={<Users />} path="/users/list" />
                                        <Route element={<Tenants />} path="/tenants" />
                                        <Route
                                            element={<StallManagement />}
                                            path="/stall-management"
                                        />
                                        <Route
                                            element={<LeaseAgreements />}
                                            path="/lease-agreements"
                                        />
                                        <Route element={<TabComponent />} path="/payments" />
                                        <Route
                                            element={<MaintenanceRequests />}
                                            path="/maintenance-requests"
                                        />
                                        <Route
                                            element={<RemindersAndNotifications />}
                                            path="/reminders-notifications"
                                        />
                                        <Route element={<Termination />} path="/termination" />
                                        <Route path="/tenants/:id" element={<TenantInfo />} />
                                        <Route element={<Utility />} path="/utility/list" />
                                        <Route element={<ReportPage />} path="/reports" />
                                        <Route path="/rent-info/:billId" element={<RentInfo />} />
                                    </>
                                ) : null}

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