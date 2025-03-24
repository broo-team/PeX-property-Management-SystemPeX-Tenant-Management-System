// import React, { useState, useEffect } from "react";
// import { useParams, Link } from "react-router-dom";
// import { 
//   Card, 
//   Spin, 
//   Tag, 
//   Button, 
//   message, 
//   Row, 
//   Col, 
//   Image, 
//   Typography, 
//   Divider, 
//   Modal, 
//   Space 
// } from "antd";
// import { CalendarOutlined, UserOutlined, DollarOutlined, FileImageOutlined } from "@ant-design/icons";
// import axios from "axios";
// import moment from "moment";

// const { Title, Text } = Typography;
// const API_BASE = "http://localhost:5000/api";

// // For now, force the building ID to a constant value.
// // Try changing this value to simulate a mismatch.
// const buildingId = 3;

// // Helper function for lease reminder logic
// const getLeaseReminder = (leaseEndDate) => {
//   const daysLeft = moment(leaseEndDate).diff(moment(), "days");

//   if (daysLeft < 0) {
//     return {
//       message: `Lease ended ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? "s" : ""} ago`,
//       isUrgent: true,
//       daysLeft,
//     };
//   } else if (daysLeft === 0) {
//     return { message: "Lease ends today", isUrgent: true, daysLeft };
//   } else if (daysLeft <= 30) {
//     return {
//       message: `Lease ending in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
//       isUrgent: true,
//       daysLeft,
//     };
//   } else {
//     return {
//       message: `Lease active. ${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining.`,
//       isUrgent: false,
//       daysLeft,
//     };
//   }
// };

// // Helper function for payment due status
// const calculateDueStatus = (dueDate) => {
//   const daysDue = moment(dueDate).diff(moment(), "days");
//   if (daysDue < 0) return { text: "Overdue", color: "red" };
//   if (daysDue <= 3) return { text: "Due Soon", color: "orange" };
//   return { text: "Upcoming", color: "green" };
// };

// const RentInfo = () => {
//   const { billId } = useParams();
//   const [billDetails, setBillDetails] = useState(null);
//   const [tenant, setTenant] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [imageVisible, setImageVisible] = useState(false);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [billResponse, tenantResponse] = await Promise.all([
//           axios.get(`${API_BASE}/rent/${billId}`),
//           axios.get(`${API_BASE}/tenants`)
//         ]);

//         const billData = billResponse.data;
//         setBillDetails(billData);

//         // Find the matching tenant by tenant_id.
//         const matchingTenant = tenantResponse.data.find(
//           (t) => Number(t.id) === Number(billData.tenant_id)
//         );

//         if (matchingTenant) {
//           // Check if the tenant's building_id matches the constant.
//           // If not, do not show any tenant (or related rent details).
//           if (Number(matchingTenant.building_id) !== buildingId) {
//             message.error("This tenant is not registered in your building.");
//             // We deliberately leave tenant as null to avoid rendering tenant-related rent info.
//             setTenant(null);
//           } else {
//             setTenant(matchingTenant);
//           }
//         } else {
//           message.error("Tenant not found");
//         }
//       } catch (error) {
//         message.error("Failed to fetch data");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [billId]);

//   const getStatusColor = (status) => {
//     switch (status.toLowerCase()) {
//       case "paid":
//         return "green";
//       case "unpaid":
//         return "red";
//       default:
//         return "blue";
//     }
//   };
//   const handlePrint = () => {
//     window.print();
//   };

//   if (loading)
//     return (
//       <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
//         <Spin size="large" tip="Loading Bill Details..." />
//       </div>
//     );

//   // If there is no bill details, or if the tenant's building does not match,
//   // we do not render the rest of the content.
//   if (!billDetails) return <div>No bill details available</div>;
//   if (!tenant) {
//     return (
//       <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
//         <Title level={3} style={{ color: "#ff4d4f" }}>
//           No rent details available for this building.
//         </Title>
//       </div>
//     );
//   }

//   const dueStatus = calculateDueStatus(billDetails.due_date);
//   let leaseReminderInfo = null;
//   if (tenant.lease_end) {
//     leaseReminderInfo = getLeaseReminder(tenant.lease_end);
//   }

//   // Calculate amounts: monthly rent, penalty, and total due.
//   const monthlyRent = parseFloat(billDetails.amount);
//   const penalty = billDetails.penalty ? parseFloat(billDetails.penalty) : 0.0;
//   const totalDue   = monthlyRent + penalty;

//   return (
//     <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
//       {/* Navigation */}
//       <div className="no-print" style={{ marginBottom: 16 }}>
//         <Button type="primary" icon={<Link to="/rent" />} >
//           Back to Rent Management
//         </Button>
//       </div>

//       <Title level={2} style={{ color: "#1d3557", marginBottom: 24 }}>
//         Rent Payment Details
//         <Text type="secondary" style={{ fontSize: 16, marginLeft: 12 }}>
//           #{billDetails.id}
//         </Text>
//       </Title>

//       <Row gutter={[24, 24]}>
//         {/* Payment Details */}
//         <Col xs={24} md={12}>
//           <Card
//             title={
//               <Space>
//                 <DollarOutlined />
//                 Payment Information
//               </Space>
//             }
//             bordered={false}
//             headStyle={{ backgroundColor: "#f0f2f5", border: "none" }}
//           >
//             <Row gutter={[16, 16]}>
//               <Col span={12}>
//                 <Text strong>Monthly Rent:</Text>
//                 <Title level={3} style={{ marginTop: 8, color: "#1d3557" }}>
//                   {monthlyRent.toFixed(2)} Birr
//                 </Title>
//               </Col>
//               <Col span={12}>
//                 <Text strong>Penalty:</Text>
//                 <Title level={3} style={{ marginTop: 8, color: "#1d3557" }}>
//                   {penalty > 0 ? penalty.toFixed(2) : "0.00"} Birr
//                 </Title>
//               </Col>
//             </Row>

//             <Divider />

//             <Row>
//               <Col span={24}>
//                 <Text strong>Total Amount Due:</Text>
//                 <Title level={3} style={{ marginTop: 8, color: "#1d3557" }}>
//                   {totalDue.toFixed(2)} Birr
//                 </Title>
//               </Col>
//             </Row>

//             <Divider />

//             <Row gutter={[16, 16]}>
//               <Col span={24}>
//                 <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
//                   <CalendarOutlined style={{ marginRight: 8, color: "#457b9d" }} />
//                   <Text strong>Due Date:</Text>
//                   <Tag color={dueStatus.color} style={{ marginLeft: 8 }}>
//                     {moment(billDetails.due_date).format("DD MMM YYYY")}
//                   </Tag>
//                   <Text type="secondary" style={{ marginLeft: 8 }}>
//                     ({dueStatus.text})
//                   </Text>
//                 </div>
//               </Col>

//               {billDetails.payment_proof_url && (
//                 <Col span={24}>
//                   <Divider />
//                   <Text strong style={{ display: "block", marginBottom: 12 }}>
//                     <FileImageOutlined /> Payment Proof:
//                   </Text>
//                   <Image
//                     preview={{ visible: false }}
//                     src={billDetails.payment_proof_url}
//                     width={200}
//                     onClick={() => setImageVisible(true)}
//                     style={{ borderRadius: 8, cursor: "pointer" }}
//                   />
//                   <Modal visible={imageVisible} footer={null} onCancel={() => setImageVisible(false)}>
//                     <img alt="Payment Proof" src={billDetails.payment_proof_url} style={{ width: "100%" }} />
//                   </Modal>
//                 </Col>
//               )}
//             </Row>
//           </Card>
//         </Col>

//         {/* Tenant Details */}
//         <Col xs={24} md={12}>
//           <Card
//             title={
//               <Space>
//                 <UserOutlined />
//                 Tenant Information
//               </Space>
//             }
//             bordered={false}
//             headStyle={{ backgroundColor: "#f0f2f5", border: "none" }}
//           >
//             <Title level={4} style={{ color: "#1d3557", marginBottom: 16 }}>
//               {tenant.full_name}
//             </Title>
//             <Row gutter={[16, 16]}>
//               <Col span={12}>
//                 <Text strong>Lease Start:</Text>
//                 <div style={{ marginTop: 8 }}>
//                   <CalendarOutlined /> {moment(tenant.lease_start).format("DD MMM YYYY")}
//                 </div>
//               </Col>
//               <Col span={12}>
//                 <Text strong>Lease End:</Text>
//                 <div style={{ marginTop: 8 }}>
//                   <CalendarOutlined /> {moment(tenant.lease_end).format("DD MMM YYYY")}
//                 </div>
//               </Col>
//             </Row>
//             {/* Display the Tenant's Building ID */}
//             <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
//               <Col span={12}>
//                 <Text strong>Building ID:</Text>
//                 <div style={{ marginTop: 8 }}>
//                   <Text>{tenant.building_id}</Text>
//                 </div>
//               </Col>
//             </Row>
//             {leaseReminderInfo && (
//               <Tag
//                 color={
//                   leaseReminderInfo.isUrgent
//                     ? leaseReminderInfo.daysLeft < 0
//                       ? "red"
//                       : "orange"
//                     : "blue"
//                 }
//                 style={{ marginTop: 16, fontSize: 14 }}
//               >
//                 {leaseReminderInfo.message}
//               </Tag>
//             )}
//           </Card>
//         </Col>
//       </Row>
//     </div>
//   );
// };

// export default RentInfo;

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

// For now, force the building ID to a constant value.
const buildingId = 3;

// Helper function for lease reminder logic
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

// Helper function for payment due status
const calculateDueStatus = (dueDate) => {
  const daysDue = moment(dueDate).diff(moment(), "days");
  if (daysDue < 0) return { text: "Overdue", color: "red" };
  if (daysDue <= 3) return { text: "Due Soon", color: "orange" };
  return { text: "Upcoming", color: "green" };
};

const RentInfo = (props) => {
  // Use the billId from props if provided (for modal use), otherwise fallback to route params.
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

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "green";
      case "unpaid":
        return "red";
      default:
        return "blue";
    }
  };

  const handlePrint = () => {
    window.print();
  };

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
      <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
        <Title level={3} style={{ color: "#ff4d4f" }}>
          No rent details available for this building.
        </Title>
      </div>
    );
  }

  const dueStatus = calculateDueStatus(billDetails.due_date);
  let leaseReminderInfo = null;
  if (tenant.lease_end) {
    leaseReminderInfo = getLeaseReminder(tenant.lease_end);
  }

  const monthlyRent = parseFloat(billDetails.amount);
  const penalty = billDetails.penalty ? parseFloat(billDetails.penalty) : 0.0;
  const totalDue = monthlyRent + penalty;

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Navigation or Close Button */}
      {isModal ? (
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={props.onClose}>
            Close
          </Button>
        </div>
      ) : (
        <div className="no-print" style={{ marginBottom: 16 }}>
          <Button type="primary">
            Back to Rent Management
          </Button>
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
        <Col xs={24} md={12}>
          <Card
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
              <Col span={12}>
                <Text strong>Monthly Rent:</Text>
                <Title level={3} style={{ marginTop: 8, color: "#1d3557" }}>
                  {monthlyRent.toFixed(2)} Birr
                </Title>
              </Col>
              <Col span={12}>
                <Text strong>Penalty:</Text>
                <Title level={3} style={{ marginTop: 8, color: "#1d3557" }}>
                  {penalty > 0 ? penalty.toFixed(2) : "0.00"} Birr
                </Title>
              </Col>
            </Row>

            <Divider />

            <Row>
              <Col span={24}>
                <Text strong>Total Amount Due:</Text>
                <Title level={3} style={{ marginTop: 8, color: "#1d3557" }}>
                  {totalDue.toFixed(2)} Birr
                </Title>
              </Col>
            </Row>

            <Divider />

            <Row gutter={[16, 16]}>
              <Col span={24}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <CalendarOutlined style={{ marginRight: 8, color: "#457b9d" }} />
                  <Text strong>Due Date:</Text>
                  <Tag color={dueStatus.color} style={{ marginLeft: 8 }}>
                    {moment(billDetails.due_date).format("DD MMM YYYY")}
                  </Tag>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    ({dueStatus.text})
                  </Text>
                </div>
              </Col>

              {billDetails.payment_proof_url && (
                <Col span={24}>
                  <Divider />
                  <Text strong style={{ display: "block", marginBottom: 12 }}>
                    <FileImageOutlined /> Payment Proof:
                  </Text>
                  <Image
                    preview={{ visible: false }}
                    src={billDetails.payment_proof_url}
                    width={200}
                    onClick={() => setImageVisible(true)}
                    style={{ borderRadius: 8, cursor: "pointer" }}
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
              )}
            </Row>
          </Card>
        </Col>

        {/* Tenant Details */}
        <Col xs={24} md={12}>
          <Card
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
              <Col span={12}>
                <Text strong>Lease Start:</Text>
                <div style={{ marginTop: 8 }}>
                  <CalendarOutlined />{" "}
                  {moment(tenant.lease_start).format("DD MMM YYYY")}
                </div>
              </Col>
              <Col span={12}>
                <Text strong>Lease End:</Text>
                <div style={{ marginTop: 8 }}>
                  <CalendarOutlined />{" "}
                  {moment(tenant.lease_end).format("DD MMM YYYY")}
                </div>
              </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Text strong>Building ID:</Text>
                <div style={{ marginTop: 8 }}>
                  <Text>{tenant.building_id}</Text>
                </div>
              </Col>
            </Row>
            {leaseReminderInfo && (
              <Tag
                color={
                  leaseReminderInfo.isUrgent
                    ? leaseReminderInfo.daysLeft < 0
                      ? "red"
                      : "orange"
                    : "blue"
                }
                style={{ marginTop: 16, fontSize: 14 }}
              >
                {leaseReminderInfo.message}
              </Tag>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RentInfo;
