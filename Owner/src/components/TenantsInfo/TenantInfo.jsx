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

function TenantInfo() {
  const { id } = useParams();
  const [tenant, setTenant] = useState(null);
  const [building, setBuilding] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/tenants/${id}`);
        setTenant(response.data);
        if (response.data.building_id) {
          fetchBuilding(response.data.building_id);
        }
      } catch (error) {
        message.error("Failed to fetch tenant details");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [id]);

  const fetchBuilding = async (building_id) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/buildings/${building_id}`);
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

  return (
    <div style={{ padding: "30px", backgroundColor: '#f7f7f7' }}>
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
              <Descriptions.Item label="Room Name" icon={<HomeOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{tenant.roomName || "N/A"}</Text>
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
              <Descriptions.Item label="Room" icon={<HomeOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{tenant.room}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Monthly Rent" icon={<MoneyCollectOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{tenant.monthlyRent || "Not set"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Payment Term" icon={<CalendarOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{tenant.payment_term}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Deposit" icon={<MoneyCollectOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{tenant.deposit}</Text>
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
              <Descriptions.Item label="EEU Payment" icon={<ThunderboltOutlined style={{ color: '#1890ff' }} />}>
                {renderPaymentStatus(tenant.eeu_payment)}
              </Descriptions.Item>
              <Descriptions.Item label="EEU Last Reading" icon={<ThunderboltOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{tenant.last_eeu_reading || "0.00"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Generator Payment" icon={<ThunderboltOutlined style={{ color: '#1890ff' }} />}>
                {renderPaymentStatus(tenant.generator_payment)}
              </Descriptions.Item>
              <Descriptions.Item label="Generator Last Reading" icon={<ThunderboltOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{tenant.last_generator_reading || "0.00"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Water Payment" icon={<EnvironmentOutlined style={{ color: '#1890ff' }} />}>
                {renderPaymentStatus(tenant.water_payment)}
              </Descriptions.Item>
              <Descriptions.Item label="Water Last Reading" icon={<EnvironmentOutlined style={{ color: '#1890ff' }} />}>
                <Text strong>{tenant.last_water_reading || "0.00"}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Agent Information */}
        <Col xs={24} sm={12} md={12} lg={12} xl={12}>
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
