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

// Base API URL.
const API_BASE = "http://localhost:5000/api";
// Renewal threshold (in days) for auto‑generation.
const AUTO_RENEW_THRESHOLD = 10;
// Define a constant date format.
const DATE_FORMAT = "YYYY-MM-DD HH:mm:ss";

// Utility: Format currency.
const formatCurrency = (value) => `${parseFloat(value).toFixed(2)} Birr`;

// Utility: Check if a status is "paid" or "approved".
const isPaidOrApproved = (status) => {
  const lowerStatus = status.toLowerCase();
  return lowerStatus === "paid" || lowerStatus === "approved";
};

/*
  Build Generate Bill Payload:
  • Reuses an existing due date if available.
  • For new tenants (or fixed tenants) calculates based on the tenant’s original_due_date.
  • Otherwise defaults to now() + paymentTerm days.
*/
const buildGenerateBillPayload = (record) => {
  const termDays = record.paymentTerm || 30;
  const now = moment();

  if (record.dueDate) {
    return {
      tenant_id: record.key,
      bill_date: now.format("YYYY-MM-DD"),
      due_date: record.dueDate,
      original_due_date: record.dueDate,
      amount: record.rentAmount * (termDays / 30),
    };
  }

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
  const [tick, setTick] = useState(0); // Live countdown updates.
  const [modalImage, setModalImage] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [proofLink, setProofLink] = useState("");
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsRecord, setDetailsRecord] = useState(null);

  // Update tick every second.
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

      // Exclude terminated tenants.
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
        const rentStart = tenant.rent_start_date;
        const rentEnd = tenant.rent_end_date;

        // Find an existing bill for this tenant.
        const tenantBill = bills.find(
          (b) => Number(b.tenant_id) === Number(tenant.id)
        );

        if (tenantBill) {
          const dueDateMoment = moment(tenantBill.due_date, DATE_FORMAT);
          const referenceDate =
            rentStart && moment(rentStart).isAfter(moment())
              ? moment(rentStart)
              : moment();
          const daysLeft = dueDateMoment.endOf("day").diff(referenceDate, "days");
          const readyForRenewal =
            isPaidOrApproved(tenantBill.payment_status) &&
            daysLeft <= AUTO_RENEW_THRESHOLD;
          return {
            key: tenant.id.toString(),
            billId: tenantBill.id,
            name: tenant.full_name,
            room: tenant.roomName,
            paymentTerm: termDays,
            term: `${termDays} days`,
            dueDate: dueDateMoment.format(DATE_FORMAT),
            billDate: moment(tenantBill.bill_date).format(DATE_FORMAT),
            rentAmount: monthlyRent,
            penalty: parseFloat(tenantBill.penalty) || 0,
            totalDue:
              parseFloat(tenantBill.amount) +
              (parseFloat(tenantBill.penalty) || 0),
            status:
              tenantBill.payment_status.charAt(0).toUpperCase() +
              tenantBill.payment_status.slice(1),
            proof: tenantBill.payment_proof_url || "",
            approved: isPaidOrApproved(tenantBill.payment_status),
            billGenerated: !readyForRenewal,
            billAutoTriggered: false,
            nextDueDate: dueDateMoment.format(DATE_FORMAT),
            daysLeft,
            // For new tenant registration use created_at logic on the backend.
            initialRegistration: false,
            original_due_date: tenant.rent_end_date
              ? moment(tenant.rent_end_date).endOf("day").format(DATE_FORMAT)
              : null,
            rent_start_date: rentStart,
            rent_end_date: rentEnd,
          };
        } else {
          // New tenant case.
          const tenantDueDate =
            rentEnd && moment(rentEnd).isAfter(moment())
              ? moment(rentEnd).endOf("day").format(DATE_FORMAT)
              : moment().add(termDays, "days").endOf("day").format(DATE_FORMAT);
          const daysLeft =
            rentStart && moment(rentStart).isAfter(moment())
              ? moment(tenantDueDate, DATE_FORMAT)
                  .endOf("day")
                  .diff(moment(rentStart), "days")
              : 0;
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
            totalDue: monthlyRent * termMonths,
            status: "pending",
            proof: "",
            approved: false,
            billGenerated: false,
            billAutoTriggered: false,
            nextDueDate: tenantDueDate,
            daysLeft,
            // For demonstration, we assume new tenants are determined by another logic.
            // The termination logic on the backend uses t.created_at to decide.
            initialRegistration: true,
            original_due_date: tenant.rent_end_date
              ? moment(tenant.rent_end_date).endOf("day").format(DATE_FORMAT)
              : null,
            rent_start_date: rentStart,
            rent_end_date: rentEnd,
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

  // Auto‑generate bills.
  const generateBill = useCallback(async (record) => {
    if (record.rent_start_date && moment(record.rent_start_date).isAfter(moment())) {
      message.info("Lease has not started. Bill generation is disabled.");
      return;
    }
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
        `Bill generated! ${newDaysLeft >= 0 ? newDaysLeft + " days left" : "Overdue"}`
      );
    } catch (error) {
      console.error("Error generating bill:", error);
      message.error("Failed to generate bill");
    }
  }, []);

  // Auto‑generate bills if needed.
  const autoGenerateBills = useCallback(() => {
    data.forEach((record) => {
      if (
        !record.billGenerated &&
        !record.billAutoTriggered &&
        (!record.rent_start_date || moment(record.rent_start_date).isSameOrBefore(moment()))
      ) {
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
  const renderGenerateBillCell = (record) => {
    if (record.rent_start_date && moment(record.rent_start_date).isAfter(moment())) {
      return <Tag color="grey">Lease Not Started</Tag>;
    }
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
    if (!record.billId) {
      return <Tag color="orange">Auto Generating...</Tag>;
    }
    return record.daysLeft !== null && record.daysLeft > AUTO_RENEW_THRESHOLD ? (
      <Tag color="blue">{record.daysLeft} days left</Tag>
    ) : (
      <Tag color="orange">Auto Generating...</Tag>
    );
  };

  // Define table columns.
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
            isPaidOrApproved(status) ? "green" :
            lowerStatus === "pending" ? "blue" : "red";
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
