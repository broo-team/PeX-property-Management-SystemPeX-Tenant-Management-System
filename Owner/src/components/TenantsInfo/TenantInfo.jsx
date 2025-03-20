// TenantInfo.js
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
  // DropletOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

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

  const fetchBuilding = async (buildingId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/buildings/${buildingId}`);
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
    <div style={{ padding: "30px", backgroundColor: '#f0f2f5' }}>
      <Title level={2} style={{ marginBottom: "20px", color: '#1890ff' }}>Tenant Details: {tenant.full_name}</Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={12} lg={12} xl={12}>
          <Card title="Personal Information" bordered={false} style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: 'white' }}>
            <Descriptions bordered={false} size="middle" column={1}>
              <Descriptions.Item label="Tenant ID" icon={<IdcardOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.tenant_id}</strong></Descriptions.Item>
              <Descriptions.Item label="Full Name" icon={<UserOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.full_name}</strong></Descriptions.Item>
              <Descriptions.Item label="Sex" icon={<UserOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.sex}</strong></Descriptions.Item>
              <Descriptions.Item label="Phone" icon={<PhoneOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.phone}</strong></Descriptions.Item>
              <Descriptions.Item label="City" icon={<EnvironmentOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.city}</strong></Descriptions.Item>
              <Descriptions.Item label="Sub City" icon={<EnvironmentOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.subcity}</strong></Descriptions.Item>
              <Descriptions.Item label="Woreda" icon={<EnvironmentOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.woreda}</strong></Descriptions.Item>
              <Descriptions.Item label="House No" icon={<HomeOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.house_no}</strong></Descriptions.Item>
              <Descriptions.Item label="Building" icon={<HomeOutlined style={{ color: '#1890ff' }} />}><strong>{building ? `${building.building_name} (ID: ${tenant.building_id})` : tenant.building_id}</strong></Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={12} xl={12}>
          <Card title="Lease & Payment Information" bordered={false} style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: 'white' }}>
            <Descriptions bordered={false} size="middle" column={1}>
              <Descriptions.Item label="Room" icon={<HomeOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.room}</strong></Descriptions.Item>
              {/* <Descriptions.Item label="Price" icon={<MoneyCollectOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.price ? tenant.price : "Not set"}</strong></Descriptions.Item>
               <Descriptions.Item label="Monthly Rent" icon={<MoneyCollectOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.price ? tenant.price : "Not set"}</strong></Descriptions.Item> */}
              <Descriptions.Item label="Payment Term" icon={<CalendarOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.payment_term}</strong></Descriptions.Item>
               <Descriptions.Item label="Monthly Rent" icon={<MoneyCollectOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.price ? tenant.price : "Not set"}</strong></Descriptions.Item>
              <Descriptions.Item label="Deposit" icon={<MoneyCollectOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.deposit}</strong></Descriptions.Item>
              <Descriptions.Item label="Lease Start" icon={<CalendarOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.lease_start ? dayjs(tenant.lease_start).format("YYYY-MM-DD") : "N/A"}</strong></Descriptions.Item>
              <Descriptions.Item label="Lease End" icon={<CalendarOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.lease_end ? dayjs(tenant.lease_end).format("YYYY-MM-DD") : "N/A"}</strong></Descriptions.Item>
              <Descriptions.Item label="Rent Start Date" icon={<CalendarOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.lease_start ? dayjs(tenant.lease_start).format("YYYY-MM-DD") : "N/A"}</strong></Descriptions.Item>
              <Descriptions.Item label="Rent End Date" icon={<CalendarOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.lease_end ? dayjs(tenant.lease_end).format("YYYY-MM-DD") : "N/A"}</strong></Descriptions.Item>
              <Descriptions.Item label="Created At" icon={<CalendarOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.created_at ? dayjs(tenant.created_at).format("YYYY-MM-DD HH:mm:ss") : "N/A"}</strong></Descriptions.Item>
            
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={12} xl={12}>
          <Card title="Utility Info" bordered={false} style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: 'white' }}>
            <Descriptions bordered={false} size="middle" column={1}>
            <Descriptions.Item label="EEU Payment" icon={<ThunderboltOutlined style={{ color: '#1890ff' }} />}>
                {renderPaymentStatus(tenant.eeu_payment)}
              </Descriptions.Item>
              <Descriptions.Item label="Generator Payment" icon={<ThunderboltOutlined style={{ color: '#1890ff' }} />}>
                {renderPaymentStatus(tenant.generator_payment)}
              </Descriptions.Item>
              <Descriptions.Item label="Water Payment" icon={`drop`}>
                {renderPaymentStatus(tenant.water_payment)}
              </Descriptions.Item>
              {/* <Descriptions.Item label="Terminated" icon={<ExclamationCircleOutlined style={{ color: '#1890ff' }} />}>
                {tenant.terminated ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">
                    Yes
                  </Tag>
                ) : (
                  <Tag icon={<CloseCircleOutlined />} color="default">
                    No
                  </Tag>
                )}
              </Descriptions.Item> */}
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={12} xl={12}>
        {tenant.registered_by_agent ? ( // If true, render agent card
  <Card title="Agent" bordered={false} style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: 'white' }}>
    <Descriptions bordered={false} size="middle" column={1}>
      <Descriptions.Item label="Registered by Agent" icon={<UsergroupAddOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.registered_by_agent ? "Yes" : "No"}</strong></Descriptions.Item>
      <Descriptions.Item label="Authentication No" icon={<IdcardOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.authentication_no || "N/A"}</strong></Descriptions.Item>
      <Descriptions.Item label="Agent First Name" icon={<UserOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.agent_first_name || "N/A"}</strong></Descriptions.Item>
      <Descriptions.Item label="Agent Sex" icon={<UserOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.agent_sex || "N/A"}</strong></Descriptions.Item>
      <Descriptions.Item label="Agent Phone" icon={<PhoneOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.agent_phone || "N/A"}</strong></Descriptions.Item>
      <Descriptions.Item label="Agent City" icon={<EnvironmentOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.agent_city || "N/A"}</strong></Descriptions.Item>
      <Descriptions.Item label="Agent Sub City" icon={<EnvironmentOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.agent_subcity || "N/A"}</strong></Descriptions.Item>
      <Descriptions.Item label="Agent Woreda" icon={<EnvironmentOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.agent_woreda || "N/A"}</strong></Descriptions.Item>
      <Descriptions.Item label="Agent House No" icon={<HomeOutlined style={{ color: '#1890ff' }} />}><strong>{tenant.agent_house_no || "N/A"}</strong></Descriptions.Item>
    </Descriptions>
  </Card>
) : null}
        </Col>
      </Row>
    </div>
  );
}

export default TenantInfo;