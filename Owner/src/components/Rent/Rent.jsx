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
// Threshold for auto-generation.
const AUTO_RENEW_THRESHOLD = 10;

// Utility: Format currency.
const formatCurrency = (value) => `${parseFloat(value).toFixed(2)} Birr`;

// Helper: Check if bill is paid/approved.
const isPaidOrApproved = (status) => {
  const lowerStatus = status.toLowerCase();
  return lowerStatus === "paid" || lowerStatus === "approved";
};

/*
  Build Generate Bill Payload

  For fixed tenants (initialRegistration true):
  - Use the tenant’s original_due_date (from registration, e.g. "2025-04-22").
  - Compute the new due date as: newDueDate = original_due_date + paymentTerm (30 days) hence "2025-05-22".
  For non-fixed tenants, build a new cycle from today.
  
  All dates are formatted as "YYYY-MM-DD".
*/
const buildGenerateBillPayload = (record) => {
  const termDays = record.paymentTerm || 30;
  const now = moment();

  if (record.initialRegistration && record.original_due_date) {
    const newDueDate = moment(record.original_due_date)
      .add(termDays, "days")
      .format("YYYY-MM-DD");
    return {
      tenant_id: record.key,
      bill_date: now.format("YYYY-MM-DD"),
      due_date: newDueDate,
      original_due_date: moment(record.original_due_date).format("YYYY-MM-DD"),
      amount: record.rentAmount * (termDays / 30),
    };
  }
  
  // For non-fixed tenants.
  const newDueDate = moment(now).add(termDays, "days").format("YYYY-MM-DD");
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
  const [tick, setTick] = useState(0); // For live re-rendering.
  const [modalImage, setModalImage] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [proofLink, setProofLink] = useState("");
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsRecord, setDetailsRecord] = useState(null);

  // Refresh dynamic fields (e.g., countdown).
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

      const mergedData = tenants.map((tenant) => {
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

        // If an existing bill is found.
        const tenantBill = bills.find((b) => Number(b.tenant_id) === Number(tenant.id));

        if (tenantBill) {
          const cycleStart = tenantBill.bill_date
            ? moment(tenantBill.bill_date)
            : moment(tenantBill.due_date);
          const nextDueDateMoment = cycleStart.clone().add(termDays, "days");
          const daysLeft = nextDueDateMoment.diff(moment(), "days");
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
            dueDate: moment(tenantBill.due_date).format("YYYY-MM-DD"),
            billDate: moment(tenantBill.bill_date).format("YYYY-MM-DD"),
            rentAmount: monthlyRent,
            penalty: parseFloat(tenantBill.penalty) || 0,
            totalDue:
              parseFloat(tenantBill.amount) +
              (parseFloat(tenantBill.penalty) || 0),
            status: tenantBill.payment_status,
            proof: tenantBill.payment_proof_url || "",
            approved: isPaidOrApproved(tenantBill.payment_status),
            billGenerated: !readyForRenewal,
            billAutoTriggered: false,
            nextDueDate: nextDueDateMoment.format("YYYY-MM-DD"),
            daysLeft,
            initialRegistration: Boolean(tenant.rent_end_date),
            // Save the tenant's fixed rent end date as original_due_date.
            original_due_date: tenant.rent_end_date
              ? tenant.rent_end_date.split("T")[0]
              : null,
          };
        } else {
          // For new tenants.
          const dueDate = tenant.rent_end_date
            ? tenant.rent_end_date.split("T")[0]
            : moment().add(termDays, "days").format("YYYY-MM-DD");
          const daysLeft = moment(dueDate).diff(moment(), "days");
          const totalRentDue = monthlyRent * termMonths;
          const autoTriggerForNew = daysLeft <= AUTO_RENEW_THRESHOLD;
          const billGenerated = !autoTriggerForNew;

          return {
            key: tenant.id.toString(),
            billId: null,
            name: tenant.full_name,
            room: tenant.room,
            paymentTerm: termDays,
            term: `${termDays} days`,
            dueDate,
            billDate: dueDate,
            rentAmount: monthlyRent,
            penalty: 0,
            totalDue: totalRentDue,
            status: "Paid",
            proof: "",
            approved: true,
            billGenerated,
            billAutoTriggered: false,
            nextDueDate: dueDate,
            daysLeft,
            initialRegistration: Boolean(tenant.rent_end_date),
            original_due_date: tenant.rent_end_date
              ? tenant.rent_end_date.split("T")[0]
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

  // Update overdue bills every 60 seconds.
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
      const payment_status = response.data.payment_status || "Unpaid";

      // For fixed tenants, compute remaining days using original_due_date.
      const updatedDaysLeft =
        record.initialRegistration && record.original_due_date
          ? moment(record.original_due_date).diff(moment(), "days")
          : record.paymentTerm;

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
                dueDate: payload.due_date, // e.g., "2025-05-22"
                penalty: 0,
                totalDue: record.rentAmount,
                billDate: payload.bill_date,
                daysLeft: updatedDaysLeft,
              }
            : item
        )
      );
      message.success(
        `Bill generated! ${
          updatedDaysLeft >= 0 ? updatedDaysLeft + " days left" : "Overdue"
        }`
      );
    } catch (error) {
      console.error("Error generating bill:", error);
      message.error("Failed to generate bill");
    }
  }, []);

  // Auto-generate bills.
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
  const handleApprove = useCallback(async (record) => {
    if (!record.billId) {
      message.error("Bill not generated. Cannot approve payment.");
      return;
    }
    try {
      await axios.patch(`${API_BASE}/rent/${record.billId}/approve`);
      setData((prevData) =>
        prevData.map((item) =>
          item.key === record.key
            ? { ...item, approved: true, status: "Paid" }
            : item
        )
      );
      message.success("Payment approved!");
    } catch (error) {
      console.error("Error approving payment:", error);
      message.error("Failed to approve payment");
    }
  }, []);

  // Modal helpers.
  const openProofModal = (record) => {
    setSelectedRecord(record);
    setProofModalVisible(true);
  };

  const handleViewImage = (record) => {
    setModalImage(record.proof);
    setSelectedRecord(record);
    setModalVisible(true);
  };

  const openDetailsModal = (record) => {
    if (!record.billId) {
      message.error("Bill not generated. Cannot view details.");
      return;
    }
    setDetailsRecord(record);
    setDetailsModalVisible(true);
  };

  /*
    Render cell for "Generate Bill":
    - For fixed tenants, compute remaining days using original_due_date.
    - For non-fixed tenants, show the full payment term.
  */
  const renderGenerateBillCell = (record) => {
    if (record.billGenerated) {
      if (record.initialRegistration && record.original_due_date) {
        const remainingDays = moment(record.original_due_date).diff(moment(), "days");
        return remainingDays >= 0 ? (
          <Tag color="blue">{remainingDays} days left</Tag>
        ) : (
          <Tag color="red">Overdue</Tag>
        );
      }
      return <Tag color="blue">{record.paymentTerm} days left</Tag>;
    }
    return record.daysLeft !== null && record.daysLeft > AUTO_RENEW_THRESHOLD ? (
      <Tag color="blue">{record.daysLeft} days left</Tag>
    ) : (
      <Tag color="orange">Auto Generating...</Tag>
    );
  };

  const columns = useMemo(
    () => [
      { title: "Tenant Name", dataIndex: "name", key: "name" },
      { title: "Room", dataIndex: "room", key: "room" },
      { title: "Payment Term", dataIndex: "term", key: "term" },
      { title: "Due Date", dataIndex: "dueDate", key: "dueDate" },
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
                onClick={() => openProofModal(record)}
              >
                Submit Proof
              </Button>
            ) : (
              <Button
                type="link"
                icon={<FileDoneOutlined />}
                onClick={() => handleViewImage(record)}
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
            <Button type="link" onClick={() => openDetailsModal(record)}>
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
          record.proof && !isPaidOrApproved(record.status) ? (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleApprove(record)}
            >
              Approve
            </Button>
          ) : (
            <Tag color={record.approved ? "green" : "red"}>
              {record.approved ? "Approved" : "Pending"}
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
            !selectedRecord.approved && (
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
