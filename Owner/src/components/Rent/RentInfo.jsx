import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Spin,
  Tag,
  Button,
  message,
  Row,
  Col,
  Image,
  Typography,
  Divider,
  Modal,
  Space,
} from "antd";
import {
  CalendarOutlined,
  UserOutlined,
  DollarOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment";

const { Title, Text } = Typography;
const API_BASE = "http://localhost:5000/api";
const buildingId = 3;

const getLeaseReminder = (leaseEndDate) => {
  const daysLeft = moment(leaseEndDate).diff(moment(), "days");

  if (daysLeft < 0) {
    return {
      message: `Lease ended ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? "s" : ""} ago`,
      isUrgent: true,
      daysLeft,
    };
  } else if (daysLeft === 0) {
    return { message: "Lease ends today", isUrgent: true, daysLeft };
  } else if (daysLeft <= 30) {
    return {
      message: `Lease ending in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
      isUrgent: true,
      daysLeft,
    };
  } else {
    return {
      message: `Lease active. ${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining.`,
      isUrgent: false,
      daysLeft,
    };
  }
};

const calculateDueStatus = (dueDate) => {
  const daysDue = moment(dueDate).diff(moment(), "days");
  if (daysDue < 0) return { text: "Overdue", color: "red" };
  if (daysDue <= 3) return { text: "Due Soon", color: "orange" };
  return { text: "Upcoming", color: "green" };
};

const RentInfo = (props) => {
  const { billId: routeBillId } = useParams();
  const billId = props.billId || routeBillId;
  const isModal = props.isModal || false;
  
  const [billDetails, setBillDetails] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageVisible, setImageVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [billResponse, tenantResponse] = await Promise.all([
          axios.get(`${API_BASE}/rent/${billId}`),
          axios.get(`${API_BASE}/tenants`),
        ]);

        const billData = billResponse.data;
        setBillDetails(billData);

        // Find the matching tenant by tenant_id.
        const matchingTenant = tenantResponse.data.find(
          (t) => Number(t.id) === Number(billData.tenant_id)
        );

        if (matchingTenant) {
          if (Number(matchingTenant.building_id) !== buildingId) {
            message.error("This tenant is not registered in your building.");
            setTenant(null);
          } else {
            setTenant(matchingTenant);
          }
        } else {
          message.error("Tenant not found");
        }
      } catch (error) {
        message.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [billId]);

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" tip="Loading Bill Details..." />
      </div>
    );

  if (!billDetails) return <div>No bill details available</div>;
  if (!tenant) {
    return (
      <div className="rent-info-container">
        <Title level={3} style={{ color: "#ff4d4f" }}>
          No rent details available for this building.
        </Title>
      </div>
    );
  }

  const dueStatus = calculateDueStatus(billDetails.due_date);
  const penaltyDays = moment().isAfter(moment(billDetails.due_date))
    ? moment().diff(moment(billDetails.due_date), "days")
    : 0;
  const monthlyRent = parseFloat(billDetails.amount);
  const penalty = billDetails.penalty ? parseFloat(billDetails.penalty) : 0.0;
  const totalDue = monthlyRent + penalty;

  return (
    <div className="rent-info-container">
      {/* Navigation / Close Button */}
      {isModal ? (
        <div className="rent-info-nav" style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={props.onClose}>
            Close
          </Button>
        </div>
      ) : (
        <div className="rent-info-nav" style={{ marginBottom: 16 }}>
          <Button type="primary">Back to Rent Management</Button>
        </div>
      )}

      <Title level={2} style={{ color: "#1d3557", marginBottom: 24 }}>
        Rent Payment Details
        <Text type="secondary" style={{ fontSize: 16, marginLeft: 12 }}>
          #{billDetails.id}
        </Text>
      </Title>

      <Row gutter={[24, 24]}>
        {/* Payment Details */}
        <Col xs={24} sm={24} md={12}>
          <Card
            className="rent-info-card"
            title={
              <Space>
                <DollarOutlined />
                Payment Information
              </Space>
            }
            bordered={false}
            headStyle={{ backgroundColor: "#f0f2f5", border: "none" }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Text strong>Monthly Rent:</Text>
                <Title level={3} style={{ marginTop: 8, color: "#1d3557" }}>
                  {monthlyRent.toFixed(2)} Birr
                </Title>
              </Col>
              <Col xs={24} sm={12}>
                <Text strong>Penalty:</Text>
                <Title level={3} style={{ marginTop: 8, color: "#1d3557" }}>
                  {penalty > 0 ? penalty.toFixed(2) : "0.00"} Birr
                </Title>
              </Col>
            </Row>

            <Divider />

            <Row>
              <Col xs={24}>
                <Text strong>Total Amount Due:</Text>
                <Title level={3} style={{ marginTop: 8, color: "#1d3557" }}>
                  {totalDue.toFixed(2)} Birr
                </Title>
              </Col>
            </Row>

            <Divider />

            <Row>
              <Col xs={24}>
                <div className="due-date-row">
                  <CalendarOutlined style={{ marginRight: 8, color: "#457b9d", fontSize: "16px" }} />
                  <Text strong>Due Date:</Text>
                  <Tag color={dueStatus.color} style={{ marginLeft: 8 }}>
                    {moment(billDetails.due_date).format("DD MMM YYYY")}
                  </Tag>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    ({dueStatus.text})
                  </Text>
                  {penaltyDays > 0 && (
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      {`(Penalty applied for ${penaltyDays} ${penaltyDays > 1 ? "days" : "day"})`}
                    </Text>
                  )}
                </div>
              </Col>
            </Row>

            {billDetails.payment_proof_url && (
              <>
                <Divider />
                <Row>
                  <Col xs={24}>
                    <Text strong style={{ display: "block", marginBottom: 12 }}>
                      <FileImageOutlined /> Payment Proof:
                    </Text>
                    <Image
                      preview={{ visible: false }}
                      src={billDetails.payment_proof_url}
                      className="payment-proof-img"
                      onClick={() => setImageVisible(true)}
                    />
                    <Modal
                      visible={imageVisible}
                      footer={null}
                      onCancel={() => setImageVisible(false)}
                    >
                      <img
                        alt="Payment Proof"
                        src={billDetails.payment_proof_url}
                        style={{ width: "100%" }}
                      />
                    </Modal>
                  </Col>
                </Row>
              </>
            )}
          </Card>
        </Col>

        {/* Tenant Details */}
        <Col xs={24} sm={24} md={12}>
          <Card
            className="rent-info-card"
            title={
              <Space>
                <UserOutlined />
                Tenant Information
              </Space>
            }
            bordered={false}
            headStyle={{ backgroundColor: "#f0f2f5", border: "none" }}
          >
            <Title level={4} style={{ color: "#1d3557", marginBottom: 16 }}>
              {tenant.full_name}
            </Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Text strong>Lease Start:</Text>
                <div style={{ marginTop: 8 }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {moment(tenant.lease_start).format("DD MMM YYYY")}
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <Text strong>Lease End:</Text>
                <div style={{ marginTop: 8 }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {moment(tenant.lease_end).format("DD MMM YYYY")}
                </div>
              </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col xs={24}>
                <Text strong>Building ID:</Text>
                <div style={{ marginTop: 8 }}>
                  <Text>{tenant.building_id}</Text>
                </div>
              </Col>
            </Row>
            {tenant.lease_end && (
              <Tag
                color={
                  getLeaseReminder(tenant.lease_end).isUrgent
                    ? getLeaseReminder(tenant.lease_end).daysLeft < 0
                      ? "red"
                      : "orange"
                    : "blue"
                }
                style={{ marginTop: 16, fontSize: 14 }}
              >
                {getLeaseReminder(tenant.lease_end).message}
              </Tag>
            )}
          </Card>
        </Col>
      </Row>
      {/* Custom CSS for responsiveness */}
      <style>{`
        .rent-info-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }
        .rent-info-nav {
          text-align: left;
        }
        .rent-info-card {
          margin-bottom: 24px;
        }
        .due-date-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 12px;
        }
        .payment-proof-img {
          width: 100%;
          max-width: 200px;
          border-radius: 8px;
          cursor: pointer;
        }
        @media (max-width: 768px) {
          .rent-info-container {
            padding: 16px;
          }
          .rent-info-nav {
            text-align: center;
          }
          .rent-info-card {
            margin-bottom: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default RentInfo;
