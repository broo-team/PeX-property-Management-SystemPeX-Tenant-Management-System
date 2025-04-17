import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Space,
  message,
  DatePicker,
  Input,
  Modal,
  Form,
  InputNumber,
} from "antd";
import dayjs from "dayjs";
import { CheckCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import minMax from 'dayjs/plugin/minMax';
// Define utility types with their labels and corresponding tenant payment fields.
const utilityTypes = [
  { key: "electricity", label: "EEU", paymentField: "eeu_payment" },
  { key: "water", label: "Water", paymentField: "water_payment" },
  { key: "generator", label: "Generator", paymentField: "generator_payment" },
];

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  dayjs.extend(minMax);
  // Modal visibility states
  const [isUtilityModalVisible, setIsUtilityModalVisible] = useState(false);
  const [isProofModalVisible, setIsProofModalVisible] = useState(false);
  const [isBillModalVisible, setIsBillModalVisible] = useState(false);

  // Selected tenant and form controls
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [form] = Form.useForm();
  const [proofForm] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---------------------------
  // Fetch and merge tenants, utility usage, and room data.
  // Also call penalty–update endpoint to ensure penalty values are current.
  // ---------------------------
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Update overdue penalties before fetching data.
   
      const [tenantsRes, usageRes, roomsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/tenants`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/utilities/tenant_utility_usage`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/stalls/getRooms`),
        axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/utilities/updatePenalties`),
      ]);
      const rooms = roomsRes.data.flat();
      // Merge tenants with their latest utility usage (by bill_date)
      const mergedData = tenantsRes.data.map((tenant) => {
        const usages = usageRes.data.filter(
          (u) => Number(u.tenant_id) === Number(tenant.tenant_id)
        );
        const utilityRecords = {};
        usages.forEach((u) => {
          const key = u.utility_type;
          if (!utilityRecords[key] || dayjs(u.bill_date).isAfter(dayjs(utilityRecords[key].bill_date))) {
            utilityRecords[key] = u;
          }
        });
        const room = rooms.find((r) => r.roomName === tenant.roomName);
        return {
          ...tenant,
          room: room || {},
          utility_usage: utilityRecords,
        };
      });
      const activeData = mergedData.filter((t) => !t.terminated);
      setPayments(activeData);
      setFilteredPayments(activeData);
      console.log("Merged tenant data:", activeData);
    } catch (error) {
      message.error("Failed to fetch data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    setFilteredPayments(payments);
  }, [payments]);

  // ---------------------------
  // Pre-populate the Utility Modal's previous reading fields.
  // ---------------------------
  useEffect(() => {
    if (selectedTenant && selectedTenant.utility_usage) {
      const fields = {};
      utilityTypes.forEach(({ key, paymentField }) => {
        if (selectedTenant[paymentField] && selectedTenant.utility_usage[key]) {
          fields[`${key}_previous`] = Number(selectedTenant.utility_usage[key].current_reading);
        }
      });
      form.setFieldsValue(fields);
    }
  }, [selectedTenant, form]);

  // ---------------------------
  // Mark tenant's regular payment as paid.
  // ---------------------------
  const handleMarkAsPaid = async (tenantId) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/tenants/${tenantId}/pay`);
      message.success("Payment marked as Paid!");
      fetchData();
    } catch (error) {
      message.error("Failed to update payment status");
      console.error(error);
    }
  };

  // ---------------------------
  // Search tenants by name or payment date.
  // ---------------------------
  const handleSearch = (filters) => {
    const filtered = payments.filter((payment) => {
      let matches = true;
      if (filters.tenantName) {
        matches = payment.full_name.toLowerCase().includes(filters.tenantName.toLowerCase());
      }
      if (filters.paymentDate) {
        const paymentDate = dayjs(filters.paymentDate);
        matches = matches && paymentDate.isSame(dayjs(payment.paymentDuty), "day");
      }
      return matches;
    });
    setFilteredPayments(filtered.length > 0 ? filtered : payments);
  };

  // ---------------------------
  // Utility Meter Reading Modal (Bill Generation)
  // ---------------------------
  const showUtilityModal = (tenant) => {
    setSelectedTenant(tenant);
    form.resetFields();
    setIsUtilityModalVisible(true);
  };

  const handleUtilitySubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedTenant) throw new Error("No tenant selected");
      const payloads = [];
      utilityTypes.forEach(({ key, paymentField, label }) => {
        if (selectedTenant[paymentField]) {
          const currentVal = values[`${key}_current`];
          if (currentVal === undefined) throw new Error(`Field ${key}_current is undefined`);
          payloads.push({
            tenant_id: selectedTenant.tenant_id,
            utility_type: key,
            current_reading: currentVal,
          });
        }
      });
      if (payloads.length === 0) throw new Error("No utility readings to submit.");
      await Promise.all(
        payloads.map((payload) =>
          axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/utilities/usage`, payload)
        )
      );
      message.success("Utility records created!");
      fetchData();
      setIsUtilityModalVisible(false);
    } catch (error) {
      console.error("Submission error:", error);
      message.error("Failed to submit utility readings: " + error.message);
    }
  };

  // ---------------------------
  // Payment Proof Upload Modal (Tenant Side)
  // ---------------------------
  const showProofModal = (tenant) => {
    setSelectedTenant(tenant);
    proofForm.resetFields();
    setIsProofModalVisible(true);
  };

  const handleProofSubmit = async () => {
    setIsSubmitting(true);
    try {
      const values = await proofForm.validateFields();
      const submissionPromises = [];
      utilityTypes.forEach(({ key, paymentField, label }) => {
        if (selectedTenant && selectedTenant[paymentField]) {
          const usage = selectedTenant.utility_usage?.[key];
          if (
            usage &&
            usage.utility_status === "Bill Generated" &&
            values[`${key}_payment_proof_link`]
          ) {
            submissionPromises.push(
              axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/utilities/confirm`, {
                tenant_id: selectedTenant.tenant_id,
                usage_id: usage.id,
                payment_proof_link: values[`${key}_payment_proof_link`],
              })
            );
          }
        }
      });
      if (submissionPromises.length > 0) {
        await Promise.all(submissionPromises);
      }
      message.success("Payment proofs submitted successfully. Await admin review.");
      fetchData();
      setIsProofModalVisible(false);
    } catch (error) {
      console.error("Error submitting payment proof:", error);
      message.error("Failed to submit payment proofs");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------
  // View Bill / Approve Payment Proof Modal (Admin Side)
  // ---------------------------
  const showBillModal = (tenant) => {
    setSelectedTenant(tenant);
    setIsBillModalVisible(true);
  };

  const handleApproveProof = async () => {
    try {
      const approvalPromises = [];
      if (selectedTenant && selectedTenant.utility_usage) {
        Object.values(selectedTenant.utility_usage).forEach((usage) => {
          if (usage.utility_status === "Submitted") {
            approvalPromises.push(
              axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/utilities/approve`, {
                usage_id: usage.id,
              })
            );
          }
        });
      }
      if (approvalPromises.length > 0) {
        await Promise.all(approvalPromises);
        message.success("Payment proofs approved successfully!");
      } else {
        message.info("No submitted proofs available for approval.");
      }
      fetchData();
      setIsBillModalVisible(false);
    } catch (error) {
      console.error("Error approving proof:", error);
      message.error("Failed to approve payment proof(s)");
    }
  };

  // ---------------------------
  // Render functions for table columns.
  // ---------------------------
  const renderUtilitySection = (record) => {
    const hasUsage = record.utility_usage && Object.keys(record.utility_usage).length > 0;
    let dueSoon = false;
    if (hasUsage) {
      dueSoon = Object.values(record.utility_usage).some((usage) => {
        // If the current bill's due_date is within 10 days, allow generating a new bill.
        const dueDate = dayjs(usage.due_date);
        return dueDate.diff(dayjs(), "day") <= 10;
      });
    }
    if (hasUsage && !dueSoon) {
      return (
        <Button type="link" onClick={() => showBillModal(record)}>
          View Bill
        </Button>
      );
    } else {
      return (
        <Button icon={<CheckCircleOutlined />} onClick={() => showUtilityModal(record)}>
          Generate Bill
        </Button>
      );
    }
  };

  // The Due Info column now shows:
  // • If the bill is still "Bill Generated", the number of days left until due.
  // • If overdue, it shows how many days overdue.
  // • If the bill is "Approved", we show "Paid. Next bill in: X day(s)" based on tenant.rent_end_date.
  const renderDueInfoCombined = (record) => {
    if (record.utility_usage && Object.keys(record.utility_usage).length > 0) {
      return Object.entries(record.utility_usage)
        .map(([ut, usage]) => {
          const label = ut === "electricity" ? "EEU" : ut === "water" ? "Water" : "Generator";
          if (usage.utility_status === "Bill Generated") {
            const dueDate = dayjs(usage.due_date);
            const diffDays = dueDate.diff(dayjs(), "day");
            if (diffDays >= 0) {
              return `${label}: ${diffDays} day(s) left until due (${dueDate.format("YYYY-MM-DD")})`;
            } else {
              return `${label}: Overdue by ${Math.abs(diffDays)} day(s)`;
            }
          } else if (usage.utility_status === "Approved") {
            // Use tenant's rent_end_date to show when next bill is due.
            const nextCycleDays = record.rent_end_date ? dayjs(record.rent_end_date).diff(dayjs(), "day") : 'N/A';
            return `${label}: Paid. Next bill in ${nextCycleDays} day(s)`;
          } else {
            return `${label}: ${usage.utility_status}`;
          }
        })
        .join(" | ");
    }
    return "-";
  };

  const renderPenaltyCombined = (record) => {
    if (record.utility_usage && Object.keys(record.utility_usage).length > 0) {
      return Object.entries(record.utility_usage)
        .map(([ut, usage]) => {
          const label = ut === "electricity" ? "EEU" : ut === "water" ? "Water" : "Generator";
          return `${label}: birr${Number(usage.penalty || 0).toFixed(2)}`;
        })
        .join(" | ");
    }
    return "-";
  };

  const renderUtilityStatusCombined = (record) => {
    if (record.utility_usage && Object.keys(record.utility_usage).length > 0) {
      return Object.entries(record.utility_usage)
        .map(([ut, usage]) => {
          const label = ut === "electricity" ? "EEU" : ut === "water" ? "Water" : "Generator";
          return `${label}: ${usage.utility_status}`;
        })
        .join(" | ");
    }
    return record.status || "-";
  };

  const renderActionsCombined = (record) => {
    const actions = [];
    if (record.status === "Unpaid") {
      actions.push(
        <Button key="pay" type="link" onClick={() => handleMarkAsPaid(record.id)}>
          Pay
        </Button>
      );
    }
    if (
      record.utility_usage &&
      Object.values(record.utility_usage).some((usage) => usage.utility_status === "Bill Generated")
    ) {
      actions.push(
        <Button key="upload" type="link" onClick={() => showProofModal(record)}>
          Upload Payment Proof
        </Button>
      );
    }
    if (
      record.utility_usage &&
      Object.values(record.utility_usage).some((usage) => usage.utility_status === "Submitted")
    ) {
      actions.push(
        <Button key="view-approve" type="link" onClick={() => showBillModal(record)}>
          View & Approve Proof
        </Button>
      );
    }
    return <Space size="middle">{actions}</Space>;
  };

  // ---------------------------
  // Table columns configuration.
  // ---------------------------
  const columns = [
    { title: "Tenant Name", dataIndex: "full_name", key: "full_name", align: "center" },
    {
      title: "Room",
      dataIndex: "room",
      key: "room",
      render: (room) => room.roomName || "-",
      align: "center"
    },
    { title: "Payment Term", dataIndex: "payment_term", key: "payment_term", align: "center" },
    {
      title: "Payment Duty",
      key: "paymentDuty",
      render: (_, record) => {
        // For tenants WITH existing utility bills
        if (record.utility_usage && Object.keys(record.utility_usage).length > 0) {
          const dueDates = Object.values(record.utility_usage)
            .map(usage => dayjs(usage.due_date))
            .filter(d => d.isValid());
  
          if (dueDates.length === 0) return "-";
          const earliestDueDate = dayjs.min(dueDates);
          return earliestDueDate.format("YYYY-MM-DD");
        }
        // For NEW tenants WITHOUT bills
        if (record.rent_start_date) {
          // First payment duty = rent_start_date + 30 days
          const dutyDate = dayjs(record.rent_start_date).add(30, 'day');
          return dutyDate.isValid() 
            ? dutyDate.format("YYYY-MM-DD")
            : "-";
        }
        return "-";
      },
      align: "center"
    },
    {
      title: "Utility Section",
      key: "utilitySection",
      render: (_, record) => renderUtilitySection(record),
      align: "center"
    },
    {
      title: "Utility Status",
      key: "utility_status",
      render: (_, record) => renderUtilityStatusCombined(record),
      align: "center"
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
      align: "center"
    },
    { title: "Penalty", key: "penalty", render: (_, record) => renderPenaltyCombined(record), align: "center" },
    { title: "Due Info", key: "dueInfo", render: (_, record) => renderDueInfoCombined(record), align: "center" },
    { title: "Actions", key: "actions", render: (_, record) => renderActionsCombined(record), align: "center" },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search by Tenant Name"
          onChange={(e) => handleSearch({ tenantName: e.target.value })}
        />
        <DatePicker
          placeholder="Search by Payment Date"
          onChange={(date) => handleSearch({ paymentDate: date })}
        />
      </Space>
      <Table
        columns={columns}
        dataSource={filteredPayments.length > 0 ? filteredPayments : payments}
        rowKey="id"
        loading={loading}
      />

      {/* Utility Meter Reading Modal */}
      <Modal
        title="Enter Utility Meter Readings"
        visible={isUtilityModalVisible}
        onCancel={() => setIsUtilityModalVisible(false)}
        onOk={handleUtilitySubmit}
      >
        <Form form={form} layout="vertical">
          {utilityTypes.map(({ key, label, paymentField }) => {
            if (selectedTenant && selectedTenant[paymentField]) {
              const previousReading =
                selectedTenant.utility_usage?.[key]?.current_reading ||
                selectedTenant[`initial_${key}`] ||
                0;
              return (
                <React.Fragment key={key}>
                  <Form.Item label={`${label} Previous Reading`}>
                    <InputNumber
                      value={previousReading}
                      disabled
                      style={{ width: "100%", background: "#f5f5f5" }}
                    />
                  </Form.Item>
                  <Form.Item
                    label={`${label} Current Reading`}
                    name={`${key}_current`}
                    rules={[
                      {
                        required: true,
                        message: `Current reading must be ≥ ${previousReading}`,
                      },
                      () => ({
                        validator(_, value) {
                          if (value >= previousReading) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error(`Must be ≥ previous reading (${previousReading})`));
                        },
                      }),
                    ]}
                  >
                    <InputNumber
                      min={previousReading}
                      style={{ width: "100%" }}
                      placeholder={`Enter current ${label} reading`}
                    />
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
        confirmLoading={isSubmitting}
      >
        <Form form={proofForm} layout="vertical">
          {utilityTypes.map(({ key, label, paymentField }) => {
            if (selectedTenant && selectedTenant[paymentField]) {
              const previousUsage = selectedTenant.utility_usage?.[key];
              const previousReading =
                previousUsage?.current_reading ||
                selectedTenant[`initial_${key}`] ||
                0;
              return (
                <React.Fragment key={key}>
                  <Form.Item label={`${label} Previous Reading`}>
                    <InputNumber
                      value={previousReading}
                      disabled
                      style={{ width: "100%", background: "#f5f5f5" }}
                    />
                  </Form.Item>
                  <Form.Item
                    label={`${label} Payment Proof Link`}
                    name={`${key}_payment_proof_link`}
                    rules={[
                      {
                        required: true,
                        message: `Please provide the payment proof link for ${label}`,
                      },
                      {
                        type: "url",
                        message: "Please enter a valid URL",
                      },
                    ]}
                  >
                    <Input placeholder={`Enter ${label} payment proof link`} />
                  </Form.Item>
                </React.Fragment>
              );
            }
            return null;
          })}
        </Form>
      </Modal>

      {/* View Bill / Approve Payment Proof Modal */}
      <Modal
        title="View Bill"
        visible={isBillModalVisible}
        onCancel={() => setIsBillModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsBillModalVisible(false)}>
            Close
          </Button>,
          selectedTenant &&
            selectedTenant.utility_usage &&
            Object.values(selectedTenant.utility_usage).some(
              (usage) => usage.utility_status === "Submitted"
            ) && (
              <Button key="approve" type="primary" onClick={handleApproveProof}>
                Approve Payment Proof
              </Button>
            ),
        ]}
      >
        {selectedTenant && (
          <div>
            {utilityTypes.map(({ key, label }) => {
              const usage = selectedTenant.utility_usage?.[key] || null;
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
                    <strong>Cost:</strong> birr{usage.cost || "N/A"}&nbsp;&nbsp;
                    <strong>Penalty:</strong> birr{Number(usage.penalty || 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Bill Date:</strong> {dayjs(usage.bill_date).format("YYYY-MM-DD")}
                  </p>
                  <p>
                    <strong>Due Date:</strong> {dayjs(usage.due_date).format("YYYY-MM-DD")}
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
