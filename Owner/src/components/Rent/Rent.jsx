// Rent.jsx
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

// Use an environment variable if defined or fallback to localhost.
const API_BASE ="http://localhost:5000/api";

// Auto-renewal threshold in days.
const AUTO_RENEW_THRESHOLD = 10;

// Utility: Format currency.
const formatCurrency = (value) => `${parseFloat(value).toFixed(2)} Birr`;

// Helper: Check if the bill status means it is paid/approved.
const isPaidOrApproved = (status) => {
  const lowerStatus = status.toLowerCase();
  return lowerStatus === "paid" || lowerStatus === "approved";
};

/*
  Updated Build Generate Bill Payload:
  If the record already has a due date and that date is still in the future,
  we re-use it (so that the "days left" remain as a reminder of the current cycle).
  Otherwise, if the due date has passed, we extend the previous due date by the payment term.
*/
const buildGenerateBillPayload = (record) => {
  // record.term is a string like "90 days", so extract termDays via parseInt.
  const termDays = parseInt(record.term, 10);
  const termMonths = termDays / 30;
  const now = moment();
  let due_date;

  if (record.dueDate && now.isBefore(moment(record.dueDate))) {
    // The current bill's due date is still in the future: do not reset.
    due_date = record.dueDate;
  } else if (record.dueDate) {
    // The previous due date has passed; extend it by the term length.
    due_date = moment(record.dueDate).add(termDays, "days").format("YYYY-MM-DD");
  } else {
    // Fallback: set due date as now + termDays.
    due_date = now.add(termDays, "days").format("YYYY-MM-DD");
  }

  return {
    tenant_id: record.key,
    bill_date: now.format("YYYY-MM-DD"),
    due_date,
    amount: record.rentAmount * termMonths, // monthly rent * number of months
  };
};


const Rent = () => {
  const [data, setData] = useState([]);
  const [tick, setTick] = useState(0); // For re-rendering dynamic fields.
  const [modalImage, setModalImage] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [proofLink, setProofLink] = useState("");
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsRecord, setDetailsRecord] = useState(null);

  // Tick update for live re-rendering (e.g. days left calculations).
  useEffect(() => {
    const interval = setInterval(() => setTick((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch tenants and bills concurrently, then merge data.
  const fetchData = useCallback(async () => {
    try {
      const [tenantRes, billRes] = await Promise.all([
        axios.get(`${API_BASE}/tenants`),
        axios.get(`${API_BASE}/rent`),
      ]);
      const tenants = tenantRes.data;
      const bills = billRes.data;

      const mergedData = tenants.map((tenant) => {
        const termDays = Number(tenant.payment_term) || 30;
        const baseAmount =
          termDays === 60 ? 1000 : parseFloat(tenant.monthlyRent) || 0;
        // Get the most recent bill for this tenant, if any.
        const tenantBill = bills.find(
          (b) => Number(b.tenant_id) === Number(tenant.id)
        );

        if (tenantBill) {
          const cycleStart = tenantBill.bill_date
            ? moment(tenantBill.bill_date)
            : moment(tenantBill.due_date);
          const nextDueDateMoment = cycleStart.clone().add(termDays, "days");
          const daysLeft = nextDueDateMoment.diff(moment(), "days");

          // If the last bill is paid/approved and the new cycle is nearing its due date,
          // mark billGenerated as false so that auto-generation can trigger (as a reminder).
          const readyForRenewal =
            isPaidOrApproved(tenantBill.payment_status) &&
            daysLeft <= AUTO_RENEW_THRESHOLD;

          return {
            key: tenant.id.toString(),
            billId: tenantBill.id,
            name: tenant.full_name,
            room: tenant.room,
            term: `${termDays} days`,
            dueDate: tenantBill.due_date,
            billDate: tenantBill.bill_date,
            rentAmount: baseAmount,
            penalty: parseFloat(tenantBill.penalty) || 0,
            totalDue:
              parseFloat(tenantBill.amount) +
              (parseFloat(tenantBill.penalty) || 0),
            status: tenantBill.payment_status,
            proof: tenantBill.payment_proof_url || "",
            approved: isPaidOrApproved(tenantBill.payment_status),
            billGenerated: !readyForRenewal, // if ready for renewal then mark as not generated
            billAutoTriggered: false,
            nextDueDate: nextDueDateMoment.format("YYYY-MM-DD"),
            daysLeft,
          };
        } else {
          // No bill exists at all.
          return {
            key: tenant.id.toString(),
            billId: null,
            name: tenant.full_name,
            room: tenant.room,
            term: `${termDays} days`,
            dueDate: tenant.rent_end_date.split("T")[0],
            billDate: null,
            rentAmount: baseAmount,
            penalty: 0,
            totalDue: baseAmount,
            status: "Pending",
            proof: "",
            approved: false,
            billGenerated: false,
            billAutoTriggered: false,
            nextDueDate: null,
            daysLeft: null,
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
        await axios.patch(`${API_BASE}/rent/updateOverdue`);
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
              }
            : item
        )
      );
      message.success(
        `Bill generated! Total Due: ${formatCurrency(record.rentAmount)}`
      );
    } catch (error) {
      console.error("Error generating bill:", error);
      message.error("Failed to generate bill");
    }
  }, []);

  // Auto-generate bills if the renewal conditions are met.
  const autoGenerateBills = useCallback(() => {
    data.forEach((record) => {
      // If billGenerated is false and no auto generation has triggered.
      if (!record.billGenerated && !record.billAutoTriggered) {
        // Mark as triggered to prevent duplicate calls.
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

  // Approve payment.
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

  // Modal helper functions.
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

  // Render cell for the "Generate Bill" column.
  const renderGenerateBillCell = (record) => {
    // If a billing request is in progress (auto trigger running) but not finalized:
    if (record.billAutoTriggered && !record.billGenerated) {
      return <Tag color="orange">Auto Generating...</Tag>;
    }
  
    // If the bill is already generated, simply show the remaining days based on dueDate.
    if (record.billGenerated) {
      const daysLeft = moment(record.dueDate).diff(moment(), "days");
      return daysLeft >= 0 ? (
        <Tag color="blue">{daysLeft} days left</Tag>
      ) : (
        <Tag color="red">Overdue</Tag>
      );
    }
  
    // For records without a generated bill, fall back on the original logic:
    return record.daysLeft !== null && record.daysLeft > AUTO_RENEW_THRESHOLD ? (
      <Tag color="blue">{record.daysLeft} days left</Tag>
    ) : (
      <Tag color="orange">Auto Generating...</Tag>
    );
  };
  
  // Memoized table columns.
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
