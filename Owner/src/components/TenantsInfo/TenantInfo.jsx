import React, { useState, useEffect } from 'react';
import { Card, Descriptions, message, Spin, Row, Col, Typography, Tag } from 'antd';
import dayjs from 'dayjs';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  IdcardOutlined,
  UserOutlined,
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
  MoneyCollectOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
  UsergroupAddOutlined,
  ThunderboltOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

// Define API_BASE using the environment variable
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function TenantInfo() {
  const { id } = useParams();
  const [tenant, setTenant] = useState(null);
  const [building, setBuilding] = useState(null);
  // Added state for room and utility usage data
  const [room, setRoom] = useState(null);
  const [utilityUsage, setUtilityUsage] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => { // Renamed to fetchData to reflect fetching multiple resources
      setLoading(true);
      try {
        // Fetch tenant details, ALL utility usage, and ALL rooms concurrently
        const [tenantResponse, usageResponse, roomsResponse] = await Promise.all([
          axios.get(`${API_BASE}/api/tenants/${id}`), // Fetch specific tenant
          axios.get(`${API_BASE}/api/utilities/tenant_utility_usage`), // Fetch ALL usage records
          axios.get(`${API_BASE}/stalls/getRooms`), // Fetch ALL rooms
        ]);

        const fetchedTenant = tenantResponse.data;
        setTenant(fetchedTenant);

        // Filter utility usage records for THIS tenant
        const tenantUsage = usageResponse.data.filter(usage =>
          // Ensure comparison works regardless of whether tenant_id is number or string
          String(usage.tenant_id) === String(fetchedTenant.tenant_id)
        );
        setUtilityUsage(tenantUsage);

        // Filter rooms to find the one associated with this tenant
        // Assuming tenant.room contains the room ID
        const rooms = roomsResponse.data.flat(); // Flatten if necessary
        const associatedRoom = rooms.find(r => String(r.id) === String(fetchedTenant.room));
        setRoom(associatedRoom || null); // Set room data, or null if not found

        // Fetch building details if building_id exists
        if (fetchedTenant.building_id) {
          fetchBuilding(fetchedTenant.building_id);
        }

      } catch (error) {
        message.error("Failed to fetch required data (tenant, usage, or rooms)");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData(); // Call the function to fetch all data

    // Dependencies for useEffect: re-run if the tenant ID changes or API_BASE changes
  }, [id, API_BASE]);

  // Helper function to fetch building details (already existed)
  const fetchBuilding = async (building_id) => {
    try {
      const response = await axios.get(`${API_BASE}/api/buildings/${building_id}`);
      setBuilding(response.data);
    } catch (error) {
      message.error("Failed to fetch building details");
      console.error(error);
    }
  };

  if (loading) return <Spin style={{ textAlign: 'center', margin: '20px' }} />;
  if (!tenant) return <div>No tenant information found.</div>;

  const renderPaymentStatus = (status) => {
    return status ? (
      <Tag icon={<CheckCircleOutlined />} color="success">
        Yes
      </Tag>
    ) : (
      <Tag icon={<CloseCircleOutlined />} color="error">
        No
      </Tag>
    );
  };

  // Process utilityUsage to find the latest reading for each utility type
  const latestUtilityReadings = {};
  if (utilityUsage && utilityUsage.length > 0) {
    utilityUsage.forEach(usage => {
      const key = usage.utility_type; // 'electricity', 'water', 'generator'
      // Keep the latest bill for each utility type based on bill_date
      if (!latestUtilityReadings[key] || dayjs(usage.bill_date).isAfter(dayjs(latestUtilityReadings[key].bill_date))) {
        latestUtilityReadings[key] = usage;
      }
    });
  }

  return (
    <div style={{ padding: "30px", backgroundColor: '#f7f7f7' }}>
      {/* Display tenant's full name in the title */}
      <Title level={2} style={{ marginBottom: "20px", color: '#1890ff' }}>
        Tenant Details: {tenant.full_name}
      </Title>
      <Row gutter={[24, 24]}>
        {/* Personal Information */}
        <Col xs={24} sm={12} md={12} lg={12} xl={12}>
          <Card
            title="Personal Information"
            bordered={false}
            style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: 'white' }}
          >
            <Descriptions bordered={false} size="middle" column={1}>
              <Descriptions.Item label="Tenant ID" icon={<IdcardOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{tenant.tenant_id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Full Name" icon={<UserOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{tenant.full_name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Sex" icon={<UserOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{tenant.sex}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Phone" icon={<PhoneOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{tenant.phone}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="City" icon={<EnvironmentOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{tenant.city}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Sub City" icon={<EnvironmentOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{tenant.subcity}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Woreda" icon={<EnvironmentOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{tenant.woreda}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="House No" icon={<HomeOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{tenant.house_no}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Building" icon={<HomeOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{building ? `${building.building_name} (ID: ${tenant.building_id})` : tenant.building_id}</Text>
              </Descriptions.Item>
              {/* Display room name from fetched room data */}
              <Descriptions.Item label="Room Name" icon={<HomeOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{room?.roomName || "N/A"}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Lease & Payment Information */}
        <Col xs={24} sm={12} md={12} lg={12} xl={12}>
          <Card
            title="Lease & Payment Information"
            bordered={false}
            style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: 'white' }}
          >
            <Descriptions bordered={false} size="middle" column={1}>
              {/* Display room ID from tenant data */}
              <Descriptions.Item label="Room" icon={<HomeOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{tenant.room || "N/A"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Monthly Rent" icon={<MoneyCollectOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{tenant.monthlyRent || "Not set"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Payment Term" icon={<CalendarOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{tenant.payment_term || "N/A"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Deposit" icon={<MoneyCollectOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{tenant.deposit || "N/A"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Lease Start" icon={<CalendarOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{tenant.lease_start ? dayjs(tenant.lease_start).format("YYYY-MM-DD") : "N/A"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Lease End" icon={<CalendarOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{tenant.lease_end ? dayjs(tenant.lease_end).format("YYYY-MM-DD") : "N/A"}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Utility Information */}
        <Col xs={24} sm={12} md={12} lg={12} xl={12}>
          <Card
            title="Utility Info"
            bordered={false}
            style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: 'white' }}
          >
            <Descriptions bordered={false} size="middle" column={1}>
              {/* EEU */}
              <Descriptions.Item label="EEU Payment" icon={<ThunderboltOutlined style={{ color: '#1890ff' }} />}>
                {renderPaymentStatus(tenant.eeu_payment)}
              </Descriptions.Item>
              {/* Display latest EEU reading or room's initial reader as fallback */}
              <Descriptions.Item label="EEU Last Reading" icon={<ThunderboltOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>
                  {latestUtilityReadings.electricity?.current_reading !== undefined // Prefer latest usage current reading
                    ? latestUtilityReadings.electricity.current_reading
                    : room?.eeuReader !== undefined // Fallback to room's initial reader if available
                    ? room.eeuReader
                    : "0.00"} {/* Default to 0.00 */}
                </Text>
              </Descriptions.Item>

              {/* Water */}
              <Descriptions.Item label="Water Payment" icon={<EnvironmentOutlined style={{ color: '#1890ff' }} />}>
                {renderPaymentStatus(tenant.water_payment)}
              </Descriptions.Item>
              {/* Display latest Water reading or room's initial reader as fallback */}
              <Descriptions.Item label="Water Last Reading" icon={<EnvironmentOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>
                  {latestUtilityReadings.water?.current_reading !== undefined // Prefer latest usage current reading
                    ? latestUtilityReadings.water.current_reading
                    : room?.water_reader !== undefined // Fallback to room's initial reader if available
                    ? room.water_reader
                    : "0.00"} {/* Default to 0.00 */}
                </Text>
              </Descriptions.Item>

              {/* Generator */}
              <Descriptions.Item label="Generator Payment" icon={<ThunderboltOutlined style={{ color: '#1890ff' }} />}>
                {renderPaymentStatus(tenant.generator_payment)}
              </Descriptions.Item>
              {/* Display latest Generator reading (no room fallback assumed for generator) */}
{/*               <Descriptions.Item label="Generator Last Reading" icon={<ThunderboltOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>
                  {latestUtilityReadings.generator?.current_reading !== undefined // Prefer latest usage current reading
                    ? latestUtilityReadings.generator.current_reading
                    : "0.00"}
                </Text>
              </Descriptions.Item> */}
            </Descriptions>
          </Card>
        </Col>

        {/* Agent Information */}
        <Col xs={24} sm={12} md={12} lg={12} xl={12}>
          {/* Render agent info card only if tenant is registered by agent */}
          {tenant.registered_by_agent ? (
            <Card
              title="Agent Information"
              bordered={false}
              style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: 'white' }}
            >
              <Descriptions bordered={false} size="middle" column={1}>
                <Descriptions.Item
                  label="Registered by Agent"
                  icon={<UsergroupAddOutlined style={{ color: '#1890ff' }} />}
                >
                  <Text strong>Yes</Text>
                </Descriptions.Item>
                <Descriptions.Item
                  label="Authentication No"
                  icon={<IdcardOutlined style={{ color: '#1890ff' }} />}
                >
                  <Text strong>{tenant.authentication_no || "N/A"}</Text>
                </Descriptions.Item>
                <Descriptions.Item
                  label="Agent First Name"
                  icon={<UserOutlined style={{ color: '#1890ff' }} />}
                >
                  <Text strong>{tenant.agent_first_name || "N/A"}</Text>
                </Descriptions.Item>
                <Descriptions.Item
                  label="Agent Sex"
                  icon={<UserOutlined style={{ color: '#1890ff' }} />}
                >
                  <Text strong>{tenant.agent_sex || "N/A"}</Text>
                </Descriptions.Item>
                <Descriptions.Item
                  label="Agent Phone"
                  icon={<PhoneOutlined style={{ color: '#1890ff' }} />}
                >
                  <Text strong>{tenant.agent_phone || "N/A"}</Text>
                </Descriptions.Item>
                <Descriptions.Item
                  label="Agent City"
                  icon={<EnvironmentOutlined style={{ color: '#1890ff' }} />}
                >
                  <Text strong>{tenant.agent_city || "N/A"}</Text>
                </Descriptions.Item>
                <Descriptions.Item
                  label="Agent Sub City"
                  icon={<EnvironmentOutlined style={{ color: '#1890ff' }} />}
                >
                  <Text strong>{tenant.agent_subcity || "N/A"}</Text>
                </Descriptions.Item>
                <Descriptions.Item
                  label="Agent Woreda"
                  icon={<EnvironmentOutlined style={{ color: '#1890ff' }} />}
                >
                  <Text strong>{tenant.agent_woreda || "N/A"}</Text>
                </Descriptions.Item>
                <Descriptions.Item
                  label="Agent House No"
                  icon={<HomeOutlined style={{ color: '#1890ff' }} />}
                >
                  <Text strong>{tenant.agent_house_no || "N/A"}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          ) : (
            <Card
              title="Agent Information"
              bordered={false}
              style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: 'white' }}
            >
              <Descriptions bordered={false} size="middle" column={1}>
                <Descriptions.Item
                  label="Registered by Agent"
                  icon={<UsergroupAddOutlined style={{ color: '#1890ff' }} />}
                >
                  <Text strong>No agent registered</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}

export default TenantInfo;