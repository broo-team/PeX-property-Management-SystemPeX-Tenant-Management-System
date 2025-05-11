import React, { useState, useEffect, useCallback, useMemo } from "react";
import moment from "moment";
import {
  Table,
  Tag,
  Space,
  Button,
  Modal,
  message,
  Form,
  Input,
} from "antd";
import {
  FileDoneOutlined,
  CheckCircleOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import axios from "axios";
import RentInfo from "./RentInfo";

// Base API URL.
const API_BASE = "http://localhost:5000/api";
// Renewal threshold (in days) for auto‑generation.
const AUTO_RENEW_THRESHOLD = 10;
// Define a constant date format (with full time components).
const DATE_FORMAT = "YYYY-MM-DD HH:mm:ss";

// Utility: Format currency values.
const formatCurrency = (value) => `${parseFloat(value).toFixed(2)} Birr`;

// Helper: Returns true if a status indicates the bill is paid or approved.
const isPaidOrApproved = (status) => {
  const lowerStatus = status.toLowerCase();
  return lowerStatus === "paid" || lowerStatus === "approved";
};

/*
  Build Generate Bill Payload

  • If the record already has a due date (from the merged data) we reuse it
    so that if a bill is generated with remaining days (e.g., bill generated at day 20 of a 30‑day term), 
    the due date stays the same and the UI shows the correct remaining days.
  • For fixed tenants (initialRegistration true), we calculate using the tenant’s original_due_date.
  • Otherwise, for non‑fixed or new tenants we default to now() + paymentTerm days.
*/
const buildGenerateBillPayload = (record) => {
  const termDays = record.paymentTerm || 30;
  const now = moment();

  // If a dueDate already exists in the record, reuse it:
  if (record.dueDate) {
    return {
      tenant_id: record.key,
      bill_date: now.format("YYYY-MM-DD"), // the backend expects only the date for bill_date
      due_date: record.dueDate,
      original_due_date: record.dueDate,
      amount: record.rentAmount * (termDays / 30),
    };
  }

  // For fixed tenants.
  if (record.initialRegistration && record.original_due_date) {
    const newDueDate = moment(record.original_due_date, "YYYY-MM-DD")
      .add(termDays, "days")
      .endOf("day")
      .format(DATE_FORMAT);
    return {
      tenant_id: record.key,
      bill_date: now.format("YYYY-MM-DD"),
      due_date: newDueDate,
      original_due_date: moment(record.original_due_date, "YYYY-MM-DD")
        .endOf("day")
        .format(DATE_FORMAT),
      amount: record.rentAmount * (termDays / 30),
    };
  }

  // Fallback for non‑fixed tenants.
  const newDueDate = now
    .clone()
    .add(termDays, "days")
    .endOf("day")
    .format(DATE_FORMAT);
  return {
    tenant_id: record.key,
    bill_date: now.format("YYYY-MM-DD"),
    due_date: newDueDate,
    original_due_date: newDueDate,
    amount: record.rentAmount * (termDays / 30),
  };
};

const Rent = () => {
  const [data, setData] = useState([]);
  const [tick, setTick] = useState(0); // to trigger live re-rendering (for countdowns)
  const [modalImage, setModalImage] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [proofLink, setProofLink] = useState("");
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsRecord, setDetailsRecord] = useState(null);

  // Tick every second to update countdown displays.
  useEffect(() => {
    const interval = setInterval(() => setTick((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch and merge tenant and bill data.
  const fetchData = useCallback(async () => {
    try {
      const [tenantRes, billRes] = await Promise.all([
        axios.get(`${API_BASE}/tenants`),
        axios.get(`${API_BASE}/rent`),
      ]);
      const tenants = tenantRes.data;
      const bills = billRes.data;

      // Only consider active tenants (those not terminated)
      const activeTenants = tenants.filter(
        (tenant) => Number(tenant.terminated) === 0
      );

      const mergedData = activeTenants.map((tenant) => {
        const termRaw = Number(tenant.payment_term) || 30;
        let termDays, termMonths;
        if (termRaw > 12) {
          termDays = termRaw;
          termMonths = termRaw / 30;
        } else {
          termMonths = termRaw;
          termDays = termRaw * 30;
        }
        const monthlyRent = parseFloat(tenant.monthlyRent) || 0;

        // Look for an existing bill for the tenant.
        const tenantBill = bills.find(
          (b) => Number(b.tenant_id) === Number(tenant.id)
        );

        if (tenantBill) {
          // Parse the stored due_date using DATE_FORMAT.
          const dueDateMoment = moment(tenantBill.due_date, DATE_FORMAT);
          const daysLeft = dueDateMoment.endOf("day").diff(moment(), "days");
          const readyForRenewal =
            isPaidOrApproved(tenantBill.payment_status) &&
            daysLeft <= AUTO_RENEW_THRESHOLD;
          return {
            key: tenant.id.toString(),
            billId: tenantBill.id,
            name: tenant.full_name,
            room: tenant.room,
            paymentTerm: termDays,
            term: `${termDays} days`,
            dueDate: moment(tenantBill.due_date, DATE_FORMAT).format(DATE_FORMAT),
            billDate: moment(tenantBill.bill_date).format(DATE_FORMAT),
            rentAmount: monthlyRent,
            penalty: parseFloat(tenantBill.penalty) || 0,
            totalDue: parseFloat(tenantBill.amount) + (parseFloat(tenantBill.penalty) || 0),
            status:
              tenantBill.payment_status.charAt(0).toUpperCase() +
              tenantBill.payment_status.slice(1),
            proof: tenantBill.payment_proof_url || "",
            approved: isPaidOrApproved(tenantBill.payment_status),
            billGenerated: !readyForRenewal,
            billAutoTriggered: false,
            nextDueDate: moment(tenantBill.due_date, DATE_FORMAT).format(DATE_FORMAT),
            daysLeft,
            initialRegistration: Boolean(tenant.rent_end_date),
            original_due_date: tenant.rent_end_date
              ? moment(tenant.rent_end_date).endOf("day").format(DATE_FORMAT)
              : null,
          };
        } else {
          // For new tenants.
          // If tenant.rent_end_date is provided and is in the future, use that; otherwise, use now() + termDays.
          const tenantDueDate =
            tenant.rent_end_date && moment(tenant.rent_end_date).isAfter(moment())
              ? moment(tenant.rent_end_date).endOf("day").format(DATE_FORMAT)
              : moment().add(termDays, "days").endOf("day").format(DATE_FORMAT);
          // For new tenants, we force daysLeft to 0 so that the UI shows "Auto Generating..." immediately.
          const daysLeft = 0;
          const totalRentDue = monthlyRent * termMonths;
          return {
            key: tenant.id.toString(),
            billId: null,
            name: tenant.full_name,
            room: tenant.room,
            paymentTerm: termDays,
            term: `${termDays} days`,
            dueDate: tenantDueDate,
            billDate: tenantDueDate,
            rentAmount: monthlyRent,
            penalty: 0,
            totalDue: totalRentDue,
            status: "pending",
            proof: "",
            approved: false,
            billGenerated: false,
            billAutoTriggered: false,
            nextDueDate: tenantDueDate,
            daysLeft,
            initialRegistration: Boolean(tenant.rent_end_date),
            original_due_date: tenant.rent_end_date
              ? moment(tenant.rent_end_date).endOf("day").format(DATE_FORMAT)
              : null,
          };
        }
      });
      setData(mergedData);
    } catch (error) {
      console.error("Error fetching merged data:", error);
      message.error("Failed to fetch tenant and bill data.");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Periodically update overdue bills.
  useEffect(() => {
    const updateOverdueBills = async () => {
      try {
        await axios.patch(`${API_BASE}/rent/updateOverdue`, {});
        fetchData();
      } catch (error) {
        console.error("Error updating overdue bills:", error);
      }
    };
    const intervalId = setInterval(updateOverdueBills, 60000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  // Generate a new bill.
  const generateBill = useCallback(async (record) => {
    const payload = buildGenerateBillPayload(record);
    try {
      const response = await axios.post(`${API_BASE}/rent/generate`, payload);
      const returnedBillId = response.data.billId;
      const payment_status = response.data.payment_status || "pending";
      const newDaysLeft = moment(payload.due_date, DATE_FORMAT)
        .endOf("day")
        .diff(moment(), "days");

      setData((prevData) =>
        prevData.map((item) =>
          item.key === record.key
            ? {
                ...item,
                billGenerated: true,
                billAutoTriggered: false,
                status:
                  payment_status.charAt(0).toUpperCase() +
                  payment_status.slice(1),
                billId: returnedBillId,
                dueDate: payload.due_date,
                penalty: 0,
                totalDue: record.rentAmount,
                billDate: payload.bill_date,
                daysLeft: newDaysLeft,
              }
            : item
        )
      );
      message.success(
        `Bill generated! ${
          newDaysLeft >= 0 ? newDaysLeft + " days left" : "Overdue"
        }`
      );
    } catch (error) {
      console.error("Error generating bill:", error);
      message.error("Failed to generate bill");
    }
  }, []);

  // Auto‑generate bills for records in need of renewal.
  const autoGenerateBills = useCallback(() => {
    data.forEach((record) => {
      if (!record.billGenerated && !record.billAutoTriggered) {
        setData((prevData) =>
          prevData.map((item) =>
            item.key === record.key ? { ...item, billAutoTriggered: true } : item
          )
        );
        generateBill(record);
      }
    });
  }, [data, generateBill]);

  useEffect(() => {
    const intervalId = setInterval(autoGenerateBills, 15000);
    return () => clearInterval(intervalId);
  }, [autoGenerateBills]);

  // Submit payment proof.
  const submitProof = async () => {
    if (!proofLink.trim()) {
      message.error("Please enter a valid image link.");
      return;
    }
    if (!selectedRecord?.billId) {
      message.error("Bill not generated. Generate the bill first.");
      return;
    }
    try {
      await axios.patch(
        `${API_BASE}/rent/${selectedRecord.billId}/proof`,
        { proof_url: proofLink }
      );
      setData((prevData) =>
        prevData.map((item) =>
          item.key === selectedRecord.key ? { ...item, proof: proofLink } : item
        )
      );
      setProofModalVisible(false);
      setProofLink("");
      message.success("Payment proof submitted!");
    } catch (error) {
      console.error("Error submitting payment proof:", error);
      message.error("Failed to submit payment proof");
    }
  };

  // Approve a payment.
  // (The backend now handles early payment credit and late penalties, and returns new cycle dates.)
  const handleApprove = useCallback(async (record) => {
    if (!record.billId) {
      message.error("Bill not generated. Cannot approve payment.");
      return;
    }
    try {
      const { data: responseData } = await axios.patch(
        `${API_BASE}/rent/${record.billId}/approve`
      );
      const { newDueDate, newBillDate } = responseData;
      const newDaysLeft = moment(newDueDate, DATE_FORMAT)
        .endOf("day")
        .diff(moment(), "days");

      setData((prevData) =>
        prevData.map((item) =>
          item.key === record.key
            ? {
                ...item,
                approved: true,
                status: "Paid",
                daysLeft: newDaysLeft,
                dueDate: newDueDate,
                billDate: newBillDate,
                original_due_date: newDueDate,
              }
            : item
        )
      );
      message.success("Payment approved!");
    } catch (error) {
      console.error("Error approving payment:", error);
      message.error("Failed to approve payment");
    }
  }, []);

  // Render cell for "Generate Bill".
  // For new tenants (i.e. when no billId exists), display "Auto Generating..." immediately.
  const renderGenerateBillCell = (record) => {
    if (record.billGenerated) {
      const remainingDays = moment(record.dueDate, DATE_FORMAT)
        .endOf("day")
        .diff(moment(), "days");
      return remainingDays >= 0 ? (
        <Tag color="blue">{remainingDays} days left</Tag>
      ) : (
        <Tag color="red">Overdue</Tag>
      );
    }
    // For new tenants or any record with no bill generated yet, if no billId exists, show auto-generating.
    if (!record.billId) {
      return <Tag color="orange">Auto Generating...</Tag>;
    }
    // For renewal cases where a billId exists but billGenerated is false, use daysLeft check.
    return record.daysLeft !== null && record.daysLeft > AUTO_RENEW_THRESHOLD ? (
      <Tag color="blue">{record.daysLeft} days left</Tag>
    ) : (
      <Tag color="orange">Auto Generating...</Tag>
    );
  };

  // Define the table columns.
  const columns = useMemo(
    () => [
      { title: "Tenant Name", dataIndex: "name", key: "name" },
      { title: "Room", dataIndex: "room", key: "room" },
      { title: "Payment Term", dataIndex: "term", key: "term" },
      { title: "Next Due Date", dataIndex: "dueDate", key: "dueDate" },
      {
        title: "Rent Amount",
        dataIndex: "rentAmount",
        key: "rentAmount",
        render: (amount) => formatCurrency(amount),
      },
      {
        title: "Penalty",
        dataIndex: "penalty",
        key: "penalty",
        render: (penalty) => formatCurrency(penalty),
      },
      {
        title: "Total Due",
        dataIndex: "totalDue",
        key: "totalDue",
        render: (total) => formatCurrency(total),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status) => {
          const lowerStatus = status.toLowerCase();
          const color =
            isPaidOrApproved(status)
              ? "green"
              : lowerStatus === "pending"
              ? "blue"
              : "red";
          return <Tag color={color}>{status.toUpperCase()}</Tag>;
        },
      },
      {
        title: "Generate Bill",
        key: "generateBill",
        render: (_, record) => renderGenerateBillCell(record),
      },
      {
        title: "Payment Proof",
        key: "proof",
        render: (_, record) => (
          <Space>
            {!record.proof ? (
              <Button
                type="dashed"
                icon={<UploadOutlined />}
                onClick={() => {
                  setSelectedRecord(record);
                  setProofModalVisible(true);
                }}
              >
                Submit Proof
              </Button>
            ) : (
              <Button
                type="link"
                icon={<FileDoneOutlined />}
                onClick={() => {
                  setModalImage(record.proof);
                  setSelectedRecord(record);
                  setModalVisible(true);
                }}
              >
                View Proof
              </Button>
            )}
          </Space>
        ),
      },
      {
        title: "Details",
        key: "details",
        render: (_, record) =>
          record.billId ? (
            <Button
              type="link"
              onClick={() => {
                if (!record.billId) {
                  message.error("Bill not generated. Cannot view details.");
                  return;
                }
                setDetailsRecord(record);
                setDetailsModalVisible(true);
              }}
            >
              View Details
            </Button>
          ) : (
            "Not Generated"
          ),
      },
      {
        title: "Approve Payment",
        key: "approve",
        render: (_, record) =>
          record.status.toLowerCase() === "submitted" ? (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleApprove(record)}
            >
              Approve
            </Button>
          ) : (
            <Tag color={record.approved ? "green" : "red"}>
              {record.approved ? "Approved" : record.status}
            </Tag>
          ),
      },
    ],
    [data, handleApprove]
  );

  return (
    <div style={{ padding: "20px" }}>
      <Table
        columns={columns}
        dataSource={data}
        bordered
        title={() => <h2>Rent Management</h2>}
        pagination={{ pageSize: 5 }}
        size="middle"
      />

      {/* Modal for Viewing Payment Proof */}
      <Modal
        visible={modalVisible}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Close
          </Button>,
          selectedRecord &&
            selectedRecord.status.toLowerCase() === "submitted" && (
              <Button
                key="approve"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(selectedRecord)}
              >
                Approve Payment
              </Button>
            ),
        ]}
        onCancel={() => setModalVisible(false)}
      >
        <img src={modalImage} alt="Proof" style={{ width: "100%" }} />
      </Modal>

      {/* Modal for Submitting Payment Proof */}
      <Modal
        visible={proofModalVisible}
        title="Submit Payment Proof"
        onCancel={() => setProofModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setProofModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<UploadOutlined />}
            onClick={submitProof}
          >
            Submit
          </Button>,
        ]}
      >
        <Form>
          <Form.Item label="Image Link" required>
            <Input
              placeholder="Enter proof image link"
              value={proofLink}
              onChange={(e) => setProofLink(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal for Rent Payment Details */}
      <Modal
        visible={detailsModalVisible}
        footer={null}
        onCancel={() => setDetailsModalVisible(false)}
        title="Rent Payment Details"
        width={700}
        bodyStyle={{ maxHeight: "80vh", overflowY: "auto" }}
        destroyOnClose
      >
        {detailsRecord && detailsRecord.billId && (
          <RentInfo
            billId={detailsRecord.billId}
            isModal
            onClose={() => setDetailsModalVisible(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default Rent;
