import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Button,
  Space,
  message,
  DatePicker,
  Input,
  Modal,
  Form,
  InputNumber,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { CheckCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import axios from "axios";

const { Title } = Typography;

// Set penalty rate (e.g. 0.01 = 1%)
const PENALTY_RATE = 0.01;

// Define utility types. Note: For electricity, flag is "eeu_payment"
const utilityTypes = [
  { key: "electricity", label: "EEU", paymentField: "eeu_payment" },
  { key: "water", label: "Water", paymentField: "water_payment" },
  { key: "generator", label: "Generator", paymentField: "generator_payment" },
];

/*
  getUtilitySectionLabel(record)
  Based on the usage records and their dates, if any record is older than the due date plus a 3-day grace period,
  the label will be "Generate Bill" (for renewal). Otherwise, it shows "View Bill".
*/
const getUtilitySectionLabel = (record) => {
  // If no utility usage exists, let the user generate a bill
  if (!record.utility_usage || Object.keys(record.utility_usage).length === 0) {
    return "Generate Bill";
  }
  const now = dayjs();
  // Use the tenant's payment term or default to 30 days
  const paymentTerm = Number(record.payment_term) || 30;
  // Set reminder to be triggered when there are 10 days remaining in the term
  const reminderThreshold = paymentTerm - 10;
  let renew = false;
  Object.values(record.utility_usage).forEach((usage) => {
    // Calculate the threshold date: when the bill should be re‑generated
    const thresholdDate = dayjs(usage.created_at).add(reminderThreshold, "day");
    if (now.isAfter(thresholdDate)) {
      renew = true;
    }
  });
  return renew ? "Generate Bill" : "View Bill";
};


// Helper: Compute minimum days left across a tenant's utility records (lower means closer to overdue)
const computeMinDaysLeft = (tenant) => {
  if (!tenant.utility_usage || Object.keys(tenant.utility_usage).length === 0) {
    return Infinity;
  }
  const paymentTerm = Number(tenant.payment_term) || 30;
  const reminderThreshold = paymentTerm - 10;
  let minDays = Infinity;
  Object.values(tenant.utility_usage).forEach((usage) => {
    const daysLeft = dayjs(usage.created_at)
      .add(reminderThreshold, "day")
      .diff(dayjs(), "day");
    if (daysLeft < minDays) {
      minDays = daysLeft;
    }
  });
  return minDays;
};

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false); // For meter reading input.
  const [isProofModalVisible, setIsProofModalVisible] = useState(false); // For uploading payment proof.
  const [isBillModalVisible, setIsBillModalVisible] = useState(false); // For viewing bill details.
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [form] = Form.useForm();
  const [proofForm] = Form.useForm();

  // ---------------------------
  // fetchData: Update overdue penalties then fetch tenants and usage records.
  // Group usage records by utility type.
  // Sort tenants so those with bills nearing due/overdue appear first.
  // ---------------------------
  const fetchData = async () => {
    try {
      // Update overdue bills: note the corrected HTTP method and URL.
      await axios.patch("http://localhost:5000/api/rent/updateOverdue");
  
      const [tenantsRes, usageRes] = await Promise.all([
        axios.get("http://localhost:5000/api/tenants"),
        axios.get("http://localhost:5000/api/utilities/tenant_utility_usage"),
      ]);
  
      // Log the responses to verify data
      console.log("Tenants data:", tenantsRes.data);
      console.log("Utility usage data:", usageRes.data);
      
      // Your merging logic...
      const mergedData = tenantsRes.data.map((tenant) => {
        const usages = usageRes.data.filter(
          (u) => Number(u.tenant_id) === Number(tenant.id)
        );
        const utilityRecords = {};
        usages.forEach((u) => {
          const key = u.utility_type;
          if (!utilityRecords[key] || Number(u.id) > Number(utilityRecords[key].id)) {
            utilityRecords[key] = u;
          }
        });
        return { ...tenant, utility_usage: utilityRecords };
      });
      const activeData = mergedData.filter((tenant) => !tenant.terminated);
      activeData.sort((a, b) => computeMinDaysLeft(a) - computeMinDaysLeft(b));
      setPayments(activeData);
      setFilteredPayments(activeData);
    } catch (error) {
      console.error("Error details:", error.response || error);
      message.error("Failed to fetch tenant and bill data.");
    }
  };
  

  useEffect(() => {
    setFilteredPayments(payments);
  }, [payments]);

  // ---------------------------
  // Pre-populate meter reading form fields when a tenant is selected.
  // ---------------------------
  useEffect(() => {
    if (selectedPayment && selectedPayment.utility_usage) {
      const fields = {};
      utilityTypes.forEach(({ key, paymentField }) => {
        if (selectedPayment[paymentField] && selectedPayment.utility_usage[key]) {
          fields[`${key}_previous`] = Number(
            selectedPayment.utility_usage[key].current_reading
          );
        }
      });
      form.setFieldsValue(fields);
    }
  }, [selectedPayment, form]);

  // ---------------------------
  // Handler: Mark a tenant's regular rent payment as paid.
  // ---------------------------
  const handleMarkAsPaid = async (tenantId) => {
    try {
      await axios.put(`http://localhost:5000/api/tenants/${tenantId}/pay`);
      message.success("Payment marked as Paid!");
      fetchData();
    } catch (error) {
      message.error("Failed to update payment status");
      console.error(error);
    }
  };

  // ---------------------------
  // Search Function: Filter tenants by name.
  // ---------------------------
  const handleSearch = (filters) => {
    const filtered = payments.filter((payment) => {
      const matchesTenant = filters.tenantName
        ? payment.full_name.toLowerCase().includes(filters.tenantName.toLowerCase())
        : true;
      return matchesTenant;
    });
    setFilteredPayments(filtered.length > 0 ? filtered : payments);
  };

  // ---------------------------
  // Meter Reading Modal Handlers
  // ---------------------------
  const showUtilityModal = (payment) => {
    setSelectedPayment(payment);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleUtilitySubmit = async () => {
    if (!selectedPayment) return message.error("No tenant selected");
    try {
      const values = await form.validateFields();
      const payloads = [];
      utilityTypes.forEach(({ key, label, paymentField }) => {
        if (selectedPayment[paymentField]) {
          if (
            values[`${key}_previous`] === undefined ||
            values[`${key}_current`] === undefined
          ) {
            return message.error(`Enter both previous and current ${label} readings`);
          }
          payloads.push({
            tenant_id: selectedPayment.id,
            utility_type: key,
            previous_reading: values[`${key}_previous`],
            current_reading: values[`${key}_current`],
          });
        }
      });
      for (const payload of payloads) {
        await axios.post("http://localhost:5000/api/utilities/usage", payload);
      }
      message.success(`Bill Generated for ${payloads.length} utility(ies)!`);
      fetchData();
      setIsModalVisible(false);
    } catch (error) {
      message.error("Failed to record utility usage");
      console.error(error);
    }
  };

  // ---------------------------
  // Payment Proof Upload Modal Handlers
  // ---------------------------
  const showProofModal = (payment) => {
    setSelectedPayment(payment);
    proofForm.resetFields();
    setIsProofModalVisible(true);
  };

  const handleProofSubmit = async () => {
    try {
      const values = await proofForm.validateFields();
      for (const { key, label, paymentField } of utilityTypes) {
        if (selectedPayment[paymentField]) {
          const usage = selectedPayment.utility_usage ? selectedPayment.utility_usage[key] : null;
          if (
            usage &&
            usage.utility_status === "Bill Generated" &&
            values[`${key}_payment_proof_link`]
          ) {
            const payload = {
              tenant_id: selectedPayment.id,
              usage_id: usage.id,
              payment_proof_link: values[`${key}_payment_proof_link`],
            };
            await axios.post("http://localhost:5000/api/utilities/confirm", payload);
          }
        }
      }
      message.success("Payment proofs submitted successfully. Await admin review.");
      fetchData();
      setIsProofModalVisible(false);
    } catch (err) {
      message.error("Failed to submit payment proofs");
      console.error(err);
    }
  };

  // ---------------------------
  // Bill View & Approval Modal Handlers.
  // ---------------------------
  const showBillModal = (payment) => {
    setSelectedPayment(payment);
    setIsBillModalVisible(true);
  };

  const handleApproveProof = async () => {
    try {
      // Optionally, update penalties right before approving.
      await axios.put("http://localhost:5000/api/utilities/updatePenalties", {
        penaltyRate: PENALTY_RATE,
      });
      let approvedOne = false;
      if (selectedPayment && selectedPayment.utility_usage) {
        for (const usage of Object.values(selectedPayment.utility_usage)) {
          if (usage.utility_status === "Submitted") {
            const payload = { usage_id: usage.id };
            await axios.post("http://localhost:5000/api/utilities/approve", payload);
            approvedOne = true;
          }
        }
      }
      if (approvedOne) {
        message.success("Selected payment proofs approved! Status updated to Approved.");
      } else {
        message.info("No submitted proof available for approval.");
      }
      fetchData();
      setIsBillModalVisible(false);
    } catch (error) {
      message.error("Failed to approve payment proof(s)");
      console.error(error);
    }
  };

  // ---------------------------
  // Renderers for combined data (showing stored penalty values)
  // ---------------------------
  const renderDynamicPenaltyCombined = (record) => {
    if (record.utility_usage && Object.keys(record.utility_usage).length > 0) {
      return (
        <>
          {Object.entries(record.utility_usage).map(([ut, usage], index) => {
            const label = ut === "electricity" ? "EEU" : ut === "water" ? "Water" : "Generator";
            return (
              <span key={ut}>
                <strong>{label}</strong>: birr{Number(usage.penalty || 0).toFixed(2)}
                {index < Object.keys(record.utility_usage).length - 1 ? " | " : ""}
              </span>
            );
          })}
        </>
      );
    }
    return "-";
  };

  const renderDynamicDueInfoCombined = (record) => {
    if (record.utility_usage && Object.keys(record.utility_usage).length > 0) {
      return (
        <>
          {Object.entries(record.utility_usage).map(([ut, usage], index) => {
            const label = ut === "electricity" ? "EEU" : ut === "water" ? "Water" : "Generator";
            const dueDate = dayjs(usage.created_at).add(30, "day");
            const diffDays = dueDate.diff(dayjs(), "day");
            return (
              <span key={ut}>
                {label}: {diffDays >= 0 ? `${diffDays} day(s) left` : "Overdue"}
                {index < Object.keys(record.utility_usage).length - 1 ? " | " : ""}
              </span>
            );
          })}
        </>
      );
    }
    return "-";
  };

  const renderUtilityStatusCombined = (record) => {
    if (record.utility_usage && Object.keys(record.utility_usage).length > 0) {
      return (
        <>
          {Object.entries(record.utility_usage).map(([ut, usage], index) => {
            const label = ut === "electricity" ? "EEU" : ut === "water" ? "Water" : "Generator";
            return (
              <span key={ut}>
                {label}: {usage.utility_status}
                {index < Object.keys(record.utility_usage).length - 1 ? " | " : ""}
              </span>
            );
          })}
        </>
      );
    }
    return record.status || "-";
  };

  const renderActionsCombined = (record) => {
    const actions = [];
    if (record.status === "Unpaid") {
      actions.push(
        <Button type="link" onClick={() => handleMarkAsPaid(record.id)} key="pay">
          Pay
        </Button>
      );
    }
    if (
      record.utility_usage &&
      Object.values(record.utility_usage).some((usage) => usage.utility_status === "Bill Generated")
    ) {
      actions.push(
        <Button type="link" onClick={() => showProofModal(record)} key="upload">
          Upload Payment Proof
        </Button>
      );
    }
    if (
      record.utility_usage &&
      Object.values(record.utility_usage).some((usage) => usage.utility_status === "Submitted")
    ) {
      actions.push(
        <Button type="link" onClick={() => showBillModal(record)} key="view-approve">
          View & Approve Proof
        </Button>
      );
    }
    return <Space size="middle">{actions}</Space>;
  };

  // ---------------------------
  // Table columns definition.
  // ---------------------------
  const columns = [
    { title: "Tenant Name", dataIndex: "full_name", key: "full_name" },
    { title: "Room", dataIndex: "room", key: "room" },
    { title: "Payment Term", dataIndex: "payment_term", key: "payment_term" },
    {
      title: "Due Date",
      dataIndex: "paymentDuty",
      key: "paymentDuty",
      render: (duty) => dayjs(duty).format("YYYY-MM-DD"),
    },
    {
      title: "Utility Section",
      key: "utilitySection",
      render: (_, record) => (
        <Button
          icon={<CheckCircleOutlined />}
          onClick={() => {
            if (getUtilitySectionLabel(record) === "Generate Bill") {
              showUtilityModal(record);
            } else {
              showBillModal(record);
            }
          }}
        >
          {getUtilitySectionLabel(record)}
        </Button>
      ),
    },
    { title: "Amount", dataIndex: "amount", key: "amount" },
    { title: "Status", dataIndex: "status", key: "status" },
    {
      title: "Utility Status",
      key: "utility_status",
      render: (_, record) => renderUtilityStatusCombined(record),
    },
    {
      title: "Payment Proof",
      key: "payment_proof_link",
      render: (_, record) =>
        record.payment_proof_link ||
        (record.utility_usage &&
          Object.values(record.utility_usage).some((u) => u.payment_proof_link)) ? (
          <Button type="link" onClick={() => showBillModal(record)}>
            View Proof
          </Button>
        ) : (
          "-"
        ),
    },
    {
      title: "Penalty",
      key: "penalty",
      render: (_, record) => renderDynamicPenaltyCombined(record),
    },
    {
      title: "Due Info",
      key: "dueInfo",
      render: (_, record) => renderDynamicDueInfoCombined(record),
    },
    { title: "Actions", key: "actions", render: (_, record) => renderActionsCombined(record) },
  ];

  const containerStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "16px",
  };

  return (
    <div style={containerStyle}>
      <Card style={{ marginBottom: "16px" }}>
        <Space style={{ width: "100%", justifyContent: "space-between", flexWrap: "wrap" }}>
          <Title level={3}>Payments Dashboard</Title>
          <div>
            <Input
              placeholder="Search by Tenant Name"
              onChange={(e) => handleSearch({ tenantName: e.target.value })}
              style={{ width: 200, marginRight: 8, marginBottom: "8px" }}
            />
            <DatePicker
              placeholder="Search by Payment Date"
              onChange={(date) => handleSearch({ paymentDate: date })}
              style={{ marginRight: 8, marginBottom: "8px" }}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchData}>
              Refresh
            </Button>
          </div>
        </Space>
      </Card>
      <Card>
        <Table
          columns={columns}
          dataSource={filteredPayments.length > 0 ? filteredPayments : payments}
          rowKey="id"
          scroll={{ x: true }}
          size="small"
        />
      </Card>

      {/* Meter Reading Modal */}
      <Modal
        title="Enter Utility Meter Readings"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleUtilitySubmit}
      >
        <Form form={form} layout="vertical">
          {utilityTypes.map(({ key, label, paymentField }) => {
            if (selectedPayment && selectedPayment[paymentField]) {
              return (
                <React.Fragment key={key}>
                  <Form.Item
                    label={`${label} Previous Reading`}
                    name={`${key}_previous`}
                    rules={[{ required: true, message: `Enter previous ${label} reading` }]}
                  >
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item
                    label={`${label} Current Reading`}
                    name={`${key}_current`}
                    rules={[{ required: true, message: `Enter current ${label} reading` }]}
                  >
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </React.Fragment>
              );
            }
            return null;
          })}
        </Form>
      </Modal>

      {/* Payment Proof Upload Modal */}
      <Modal
        title="Upload Payment Proof"
        visible={isProofModalVisible}
        onCancel={() => setIsProofModalVisible(false)}
        onOk={handleProofSubmit}
      >
        <Form form={proofForm} layout="vertical">
          {utilityTypes.map(({ key, label, paymentField }) => {
            if (
              selectedPayment &&
              selectedPayment[paymentField] &&
              selectedPayment.utility_usage &&
              selectedPayment.utility_usage[key] &&
              selectedPayment.utility_usage[key].utility_status === "Bill Generated"
            ) {
              return (
                <Form.Item
                  key={key}
                  label={`${label} Payment Proof`}
                  name={`${key}_payment_proof_link`}
                  rules={[
                    { required: true, message: `Enter the ${label} Payment Proof URL` },
                  ]}
                >
                  <Input placeholder={`Enter URL for ${label} Payment Proof`} />
                </Form.Item>
              );
            }
            return null;
          })}
        </Form>
      </Modal>

      {/* Bill View & Approval Modal */}
      <Modal
        title="View Bill Details"
        visible={isBillModalVisible}
        onCancel={() => setIsBillModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsBillModalVisible(false)}>
            Close
          </Button>,
          selectedPayment &&
            selectedPayment.utility_usage &&
            Object.values(selectedPayment.utility_usage).some(
              (usage) => usage.utility_status === "Submitted"
            ) && (
              <Button key="approve" type="primary" onClick={handleApproveProof}>
                Approve Payment Proof
              </Button>
            ),
        ]}
      >
        {selectedPayment && (
          <div>
            {utilityTypes.map(({ key, label }) => {
              const usage =
                selectedPayment.utility_usage &&
                selectedPayment.utility_usage[key]
                  ? selectedPayment.utility_usage[key]
                  : null;
              return usage ? (
                <div
                  key={key}
                  style={{
                    marginBottom: "1em",
                    borderBottom: "1px solid #eee",
                    paddingBottom: "0.5em",
                  }}
                >
                  <p>
                    <strong>{label} Details:</strong>
                  </p>
                  <p>
                    <strong>Cost:</strong> birr{usage.cost || "N/A"}
                  </p>
                  <p>
                    <strong>Penalty:</strong> birr{(Number(usage.penalty) || 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Total Due:</strong>{" "}
                    birr{(Number(usage.cost) + Number(usage.penalty)).toFixed(2)}
                  </p>
                  <p>
                    <strong>Status:</strong> {usage.utility_status}
                  </p>
                  {usage.payment_proof_link ? (
                    <div>
                      <p>
                        <strong>{label} Payment Proof:</strong>
                      </p>
                      <img
                        src={usage.payment_proof_link}
                        alt={`${label} Payment Proof`}
                        style={{ width: "100%" }}
                      />
                    </div>
                  ) : (
                    <p>No Payment Proof Submitted for {label}.</p>
                  )}
                  {usage.utility_status === "Bill Generated" &&
  dayjs().isAfter(
    dayjs(usage.created_at).add(selectedPayment.payment_term || 30, "day")
  ) && (
    <p style={{ color: "red" }}>
      Late Payment History: This bill is overdue. Please generate a new bill to renew.
    </p>
)}
{usage.utility_status === "Bill Generated" &&
  dayjs().isBefore(
    dayjs(usage.created_at).add(selectedPayment.payment_term || 30, "day")
  ) && (
    <p style={{ color: "green" }}>
      This is the current bill. It will renew if payment is not received.
    </p>
)}

                </div>
              ) : null;
            })}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Payments;
