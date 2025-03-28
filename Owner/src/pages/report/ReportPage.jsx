
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Row, Col, Table, Spin, Divider, Tag, DatePicker, Button } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import axios from 'axios';

const { Header, Content, Footer } = Layout;
const { RangePicker } = DatePicker;

// ======================================================================================================================
// DashboardHeader Component
// ======================================================================================================================
// This component renders the persistent header seen at the top of the report page.
// It includes a title and a horizontal navigation menu (where additional items may be added).
// ======================================================================================================================
const DashboardHeader = () => {
  return (
    <Header style={{ backgroundColor: '#1890ff', padding: '0 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <h1 style={{ color: '#fff', marginRight: 'auto' }}>Tenant &amp; Room API Report</h1>
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['1']}
          style={{ lineHeight: '64px' }}
        >
          <Menu.Item key="1">Dashboard</Menu.Item>
          <Menu.Item key="2">Reports</Menu.Item>
          <Menu.Item key="3">Settings</Menu.Item>
        </Menu>
      </div>
    </Header>
  );
};

// ======================================================================================================================
// SummaryCards Component
// ======================================================================================================================
// Displays high-level statistical summaries in a grid of Ant Design Cards.
//
// Metrics included:
//   - Total Tenants, Active/Terminated Tenants, and Total Tenant Monthly Rent
//   - Total Rooms, Available/Taken Rooms, and Total Room Monthly Rent
//
// Data is calculated by processing the fetched tenants and rooms arrays.
// ======================================================================================================================
const SummaryCards = ({ tenantsData, roomsData }) => {
  // --- Tenant Metrics ---
  const totalTenants = tenantsData.length;
  const activeTenants = tenantsData.filter((tenant) => tenant.terminated === 0).length;
  const terminatedTenants = totalTenants - activeTenants;
  const totalMonthlyRentTenants = tenantsData.reduce(
    (acc, tenant) => acc + parseFloat(tenant.monthlyRent),
    0
  );

  // --- Room Metrics ---
  // Since the API returns room data as an array of arrays, flatten it first.
  const flattenedRooms = roomsData.flat();
  const totalRooms = flattenedRooms.length;
  const availableRooms = flattenedRooms.filter((room) => room.status === 'available').length;
  const takenRooms = totalRooms - availableRooms;
  const totalMonthlyRentRooms = flattenedRooms.reduce(
    (acc, room) => acc + parseFloat(room.monthlyRent),
    0
  );

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={8}>
        <Card title="Total Tenants" bordered={false}>
          <h2>{totalTenants}</h2>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Card title="Active / Terminated Tenants" bordered={false}>
          <h2>
            {activeTenants} / {terminatedTenants}
          </h2>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Card title="Total Tenant Monthly Rent" bordered={false}>
          <h2>${totalMonthlyRentTenants.toFixed(2)}</h2>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Card title="Total Rooms" bordered={false}>
          <h2>{totalRooms}</h2>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Card title="Available / Taken Rooms" bordered={false}>
          <h2>
            {availableRooms} / {takenRooms}
          </h2>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Card title="Total Room Monthly Rent" bordered={false}>
          <h2>${totalMonthlyRentRooms.toFixed(2)}</h2>
        </Card>
      </Col>
    </Row>
  );
};

// ======================================================================================================================
// TenantTable Component
// ======================================================================================================================
// Renders a detailed table of tenant information with features like column sorting,
// pagination, and horizontal scrolling.
// ======================================================================================================================
const TenantTable = ({ tenantsData }) => {
  // Define table columns and the object keys they correspond to.
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id - b.id
    },
    {
      title: 'Tenant ID',
      dataIndex: 'tenant_id',
      key: 'tenant_id'
    },
    {
      title: 'Full Name',
      dataIndex: 'full_name',
      key: 'full_name'
    },
    {
      title: 'Sex',
      dataIndex: 'sex',
      key: 'sex'
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city'
    },
    {
      title: 'Subcity',
      dataIndex: 'subcity',
      key: 'subcity'
    },
    {
      title: 'Room',
      dataIndex: 'room',
      key: 'room'
    },
    {
      title: 'Monthly Rent',
      dataIndex: 'monthlyRent',
      key: 'monthlyRent',
      render: (text) => `$${parseFloat(text).toFixed(2)}`
    },
    {
      title: 'Terminated',
      dataIndex: 'terminated',
      key: 'terminated',
      render: (text) =>
        text === 1 ? <Tag color="red">Yes</Tag> : <Tag color="green">No</Tag>
    },
    {
      title: 'Lease Start',
      dataIndex: 'lease_start',
      key: 'lease_start'
    },
    {
      title: 'Lease End',
      dataIndex: 'lease_end',
      key: 'lease_end'
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at'
    }
  ];

  return (
    <>
      <Divider orientation="left">Tenant Details</Divider>
      <Table
        dataSource={tenantsData}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 5, showSizeChanger: true }}
        scroll={{ x: true }}
      />
    </>
  );
};

// ======================================================================================================================
// RoomTable Component
// ======================================================================================================================
// Renders a table for room details. As the room information is grouped in arrays,
// the data is first flattened. The table includes sortable columns and status tags.
// ======================================================================================================================
const RoomTable = ({ roomsData }) => {
  // Flatten the data structure from the API response.
  const flattenedRooms = roomsData.flat();
  // Define table columns for the room properties.
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id - b.id
    },
    {
      title: 'Stall ID',
      dataIndex: 'stall_id',
      key: 'stall_id'
    },
    {
      title: 'Room Name',
      dataIndex: 'roomName',
      key: 'roomName'
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size'
    },
    {
      title: 'Monthly Rent',
      dataIndex: 'monthlyRent',
      key: 'monthlyRent',
      render: (text) => `$${parseFloat(text).toFixed(2)}`
    },
    {
      title: 'EEU Reader',
      dataIndex: 'eeuReader',
      key: 'eeuReader'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) =>
        status === 'available' ? (
          <Tag color="green">Available</Tag>
        ) : (
          <Tag color="volcano">Taken</Tag>
        )
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at'
    }
  ];

  return (
    <>
      <Divider orientation="left">Room Details</Divider>
      <Table
        dataSource={flattenedRooms}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 5, showSizeChanger: true }}
        scroll={{ x: true }}
      />
    </>
  );
};

// ======================================================================================================================
// ChartsSection Component
// ======================================================================================================================
// Includes multiple interactive charts that provide visual insights:
//   • A Pie Chart breaking down tenant termination status (active vs. terminated)
//   • A Bar Chart showing the distribution of tenant monthly rents (by room name)
//   • A Pie Chart showing room availability status (available vs. taken)
//   • A Line Chart tracking tenant creation over time (aggregated by date)
// ======================================================================================================================
const ChartsSection = ({ tenantsData, roomsData }) => {
  // Prepare Pie Chart data for tenant termination
  const activeTenants = tenantsData.filter((tenant) => tenant.terminated === 0).length;
  const terminatedTenants = tenantsData.filter((tenant) => tenant.terminated === 1).length;
  const tenantTerminationData = [
    { name: 'Active', value: activeTenants },
    { name: 'Terminated', value: terminatedTenants }
  ];

  // Prepare Bar Chart data for tenant monthly rent distribution (using roomName as label)
  const tenantRentData = tenantsData.map((tenant) => ({
    roomName: tenant.roomName,
    monthlyRent: parseFloat(tenant.monthlyRent)
  }));

  // Prepare Pie Chart data for room availability status
  const flattenedRooms = roomsData.flat();
  const availableRooms = flattenedRooms.filter((room) => room.status === 'available').length;
  const takenRooms = flattenedRooms.filter((room) => room.status === 'taken').length;
  const roomStatusData = [
    { name: 'Available', value: availableRooms },
    { name: 'Taken', value: takenRooms }
  ];

  // Colors used in multiple charts (repeated here for consistency)
  const COLORS = ['#0088FE', '#FF8042'];

  // Prepare Line Chart data: group tenants by creation date (YYYY-MM-DD) and count per day.
  const tenantActivityData = Object.values(
    tenantsData.reduce((acc, tenant) => {
      const date = tenant.created_at.split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, count: 0 };
      }
      acc[date].count += 1;
      return acc;
    }, {})
  );

  return (
    <>
      <Divider orientation="left">Data Visualizations</Divider>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Tenant Termination Breakdown">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tenantTerminationData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {tenantTerminationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Tenant Monthly Rent Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tenantRentData}>
                <XAxis dataKey="roomName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="monthlyRent" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
        <Col xs={24} md={12}>
          <Card title="Room Availability Status">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roomStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {roomStatusData.map((entry, index) => (
                    <Cell key={`cell-room-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Tenant Activity Over Time">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tenantActivityData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </>
  );
};

// ======================================================================================================================
// ReportFooter Component
// ======================================================================================================================
// Renders the footer that is persistently visible at the bottom of the report.
// Typically includes copyright information, the generation timestamp, and optional attribution.
// ======================================================================================================================
const ReportFooter = () => {
  return (
    <Footer style={{ textAlign: 'center' }}>
      Tenant &amp; Room API Report ©2025 Created by Your Company | Report generated at{' '}
      {new Date().toLocaleString()}
    </Footer>
  );
};

// ======================================================================================================================
// DateFilter Component
// ======================================================================================================================
// Provides a date range picker to allow the user to filter both tenant and room data by creation date.
// The component calls back to the parent component with the chosen start and end dates.
// ======================================================================================================================
const DateFilter = ({ onFilter }) => {
  // Local state for range picker values.
  const [dates, setDates] = useState([]);

  // Handler for when the date range picker changes.
  const handleChange = (values) => {
    setDates(values);
  };

  // Handler to apply the filter.
  const applyFilter = () => {
    if (dates.length === 2) {
      onFilter(dates[0].toDate(), dates[1].toDate());
    } else {
      onFilter(null, null);
    }
  };

  return (
    <Row gutter={16} style={{ marginBottom: '20px' }}>
      <Col>
        <RangePicker onChange={handleChange} />
      </Col>
      <Col>
        <Button type="primary" onClick={applyFilter}>
          Apply Filter
        </Button>
      </Col>
    </Row>
  );
};

// ======================================================================================================================
// Main ReportPage Component
// ======================================================================================================================
// Aggregates all subcomponents and handles data fetching, error handling, filtering, and rendering
// the full report. It makes asynchronous calls to fetch tenants and rooms from the provided API endpoints,
// applies any active date filters, and then renders summary cards, charts, tables, and detailed logs.
// ======================================================================================================================
function ReportPage() {
  // --------------------------------------------------------------------------------------------------------------------
  // State variables to hold API data and component status.
  // --------------------------------------------------------------------------------------------------------------------
  const [tenantsData, setTenantsData] = useState([]);
  const [roomsData, setRoomsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for filtering by creation date.
  const [filterStart, setFilterStart] = useState(null);
  const [filterEnd, setFilterEnd] = useState(null);

  // --------------------------------------------------------------------------------------------------------------------
  // Data Fetching Functions
  // --------------------------------------------------------------------------------------------------------------------
  // Fetch tenants data from http://localhost:5000/api/tenants
  const fetchTenants = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/tenants');
      const data = Array.isArray(response.data) ? response.data : [response.data];
      setTenantsData(data);
    } catch (err) {
      console.error('Error fetching tenants:', err);
      setError('Failed to fetch tenants data.');
    }
  };

  // Fetch rooms data from http://localhost:5000/stalls/getRooms
  const fetchRooms = async () => {
    try {
      const response = await axios.get('http://localhost:5000/stalls/getRooms');
      const data = response.data; // Expecting an array of arrays
      setRoomsData(data);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Failed to fetch rooms data.');
    }
  };

  // --------------------------------------------------------------------------------------------------------------------
  // useEffect to load data on component mount.
  // --------------------------------------------------------------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchTenants(), fetchRooms()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  // --------------------------------------------------------------------------------------------------------------------
  // Filtering: Only apply filter if both start and end dates are provided.
  // --------------------------------------------------------------------------------------------------------------------
  const filterDataByDate = (start, end) => {
    setFilterStart(start);
    setFilterEnd(end);
  };

  // Apply date filtering to tenants data based on their created_at field.
  const filteredTenants =
    filterStart && filterEnd
      ? tenantsData.filter((tenant) => {
          const createdAt = new Date(tenant.created_at);
          return createdAt >= filterStart && createdAt <= filterEnd;
        })
      : tenantsData;

  // Apply date filtering to rooms data if needed.
  const filteredRooms =
    filterStart && filterEnd
      ? roomsData.map((group) =>
          group.filter((room) => {
            const createdAt = new Date(room.created_at);
            return createdAt >= filterStart && createdAt <= filterEnd;
          })
        )
      : roomsData;

  // --------------------------------------------------------------------------------------------------------------------
  // Loading State: Show spinner while data is being fetched.
  // --------------------------------------------------------------------------------------------------------------------
  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <Spin size="large" tip="Loading data, please wait..." />
      </div>
    );
  }

  // --------------------------------------------------------------------------------------------------------------------
  // Error State: Display an error message if fetching data fails.
  // --------------------------------------------------------------------------------------------------------------------
  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', color: 'red' }}>
        <h2>{error}</h2>
      </div>
    );
  }

  // --------------------------------------------------------------------------------------------------------------------
  // Main rendering of the page after data is loaded and filtered.
  // --------------------------------------------------------------------------------------------------------------------
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <DashboardHeader />
      <Content style={{ padding: '20px 50px' }}>
        {/* Date Filter allows users to select a date range */}
        <DateFilter onFilter={filterDataByDate} />

        {/* Summary Section: Renders aggregated information using cards */}
        <SummaryCards tenantsData={filteredTenants} roomsData={filteredRooms} />

        <Divider />

        {/* Charts Section: Visualizes key data trends */}
        <ChartsSection tenantsData={filteredTenants} roomsData={filteredRooms} />

        <Divider />

        {/* Detailed Tables: Two columns showing tenants and rooms details */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <TenantTable tenantsData={filteredTenants} />
          </Col>
          <Col xs={24} lg={12}>
            <RoomTable roomsData={filteredRooms} />
          </Col>
        </Row>

        <Divider />

        {/* Detailed Logs Card: Raw data for debugging or further analysis */}
        <Card title="Detailed Logs">
          <pre
            style={{
              maxHeight: '300px',
              overflow: 'auto',
              background: '#f5f5f5',
              padding: '10px'
            }}
          >
            {JSON.stringify({ tenants: filteredTenants, rooms: filteredRooms }, null, 2)}
          </pre>
        </Card>
      </Content>
      <ReportFooter />
    </Layout>
  );
}


export default ReportPage;
