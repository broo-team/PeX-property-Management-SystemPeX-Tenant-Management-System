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
  PlusCircleOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import axios from "axios";
import RentInfo from "./RentInfo";

// Use environment variable if defined or default to localhost.
const API_BASE = "http://localhost:5000/api";

// Constants for thresholds and rates.
const OVERDUE_THRESHOLD = 60; // days before penalty applies
const AUTO_RENEW_THRESHOLD = 10; // days remaining to trigger auto-generation
const PENALTY_RATE = 0.01;

const Rent = () => {
  const [data, setData] = useState([]);
  const [modalImage, setModalImage] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [proofLink, setProofLink] = useState("");
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsRecord, setDetailsRecord] = useState(null);

  // This state, updated every second, forces a re-render so that the "days left"
  // display remains current without new API calls.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(tickInterval);
  }, []);

  // ------------------------------------------------------------------
  // Fetch tenants and bills concurrently, then merge the data.
  // ------------------------------------------------------------------
  const fetchData = async () => {
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

        // Look for an existing bill for the tenant.
        const bill = bills.find(
          (b) => Number(b.tenant_id) === Number(tenant.id)
        );

        if (bill) {
          return {
            key: tenant.id.toString(),
            billId: bill.id, // ID of the generated bill
            name: tenant.full_name,
            room: tenant.room,
            term: `${termDays} days`,
            dueDate: bill.due_date || tenant.rent_end_date.split("T")[0],
            billDate: bill.bill_date || null,
            rentAmount: baseAmount,
            penalty: parseFloat(bill.penalty) || 0,
            totalDue: parseFloat(bill.amount) + (parseFloat(bill.penalty) || 0),
            status: bill.payment_status, // e.g., "pending", "submitted", "approved", "paid"
            proof: bill.payment_proof_url || "",
            approved:
              bill.payment_status &&
              (bill.payment_status.toLowerCase() === "approved" ||
                bill.payment_status.toLowerCase() === "paid"),
            billGenerated: true,
            billAutoTriggered: false, // flag for auto-generation
          };
        } else {
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
          };
        }
      });

      setData(mergedData);
    } catch (error) {
      console.error("Error fetching merged data:", error);
      message.error("Failed to fetch tenant and bill data.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ------------------------------------------------------------------
  // Auto-update overdue bills every minute.
  // ------------------------------------------------------------------
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
  }, []);

  // ------------------------------------------------------------------
  // Auto-renew / Auto-generate bill effect.
  // ------------------------------------------------------------------
  useEffect(() => {
    const autoGenerateBill = () => {
      data.forEach((record) => {
        // Skip if already auto-triggered or if bill has been generated.
        if (record.billAutoTriggered || record.billGenerated) return;

        const lowerStatus = record.status.toLowerCase();

        if (lowerStatus === "paid" || lowerStatus === "approved") {
          const termDays = parseInt(record.term, 10);
          const cycleStart = record.billDate
            ? moment(record.billDate)
            : moment(record.dueDate);
          const nextDueDate = cycleStart.clone().add(termDays, "days");
          const daysLeft = nextDueDate.diff(moment(), "days");

          if (daysLeft <= AUTO_RENEW_THRESHOLD) {
            // Mark as auto-triggered and generate bill automatically.
            setData((prevData) =>
              prevData.map((item) =>
                item.key === record.key
                  ? { ...item, billAutoTriggered: true }
                  : item
              )
            );
            generateBill(record);
          }
        } else {
          // For pending or other non-paid statuses.
          const daysLeft = moment(record.dueDate).diff(moment(), "days");
          if (daysLeft <= AUTO_RENEW_THRESHOLD && !record.billGenerated) {
            setData((prevData) =>
              prevData.map((item) =>
                item.key === record.key
                  ? { ...item, billAutoTriggered: true }
                  : item
              )
            );
            generateBill(record);
          }
        }
      });
    };

    // Run the auto-generation check every 15 seconds.
    const intervalId = setInterval(autoGenerateBill, 15000);
    return () => clearInterval(intervalId);
  }, [data]);

  // ------------------------------------------------------------------
  // Generate a new bill.
  // ------------------------------------------------------------------
  const generateBill = async (record) => {
    let payload;
    const lowerStatus = record.status.toLowerCase();
    const termDays = parseInt(record.term, 10);

    if (lowerStatus === "paid" || lowerStatus === "approved") {
      const cycleStart = record.billDate
        ? moment(record.billDate)
        : moment(record.dueDate);
      const nextDueDate = cycleStart.clone().add(termDays, "days");
      const daysLeft = nextDueDate.diff(moment(), "days");

      if (daysLeft <= AUTO_RENEW_THRESHOLD) {
        const newDueDate = moment().add(termDays, "days").format("YYYY-MM-DD");
        payload = {
          tenant_id: record.key,
          bill_date: moment().format("YYYY-MM-DD"),
          due_date: newDueDate,
          amount: record.rentAmount,
        };
      } else {
        let penalty = 0;
        if (daysLeft < 0 && Math.abs(daysLeft) > OVERDUE_THRESHOLD) {
          penalty =
            record.rentAmount *
            (PENALTY_RATE * (Math.abs(daysLeft) - OVERDUE_THRESHOLD));
        }
        payload = {
          tenant_id: record.key,
          bill_date: moment().format("YYYY-MM-DD"),
          due_date: record.dueDate,
          amount: record.rentAmount,
        };
      }
    } else {
      const daysLeft = moment(record.dueDate).diff(moment(), "days");
      let penalty = 0;
      if (daysLeft < 0 && Math.abs(daysLeft) > OVERDUE_THRESHOLD) {
        penalty =
          record.rentAmount *
          (PENALTY_RATE * (Math.abs(daysLeft) - OVERDUE_THRESHOLD));
      }
      payload = {
        tenant_id: record.key,
        bill_date: moment().format("YYYY-MM-DD"),
        due_date: record.dueDate,
        amount: record.rentAmount,
      };
    }

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
                dueDate:
                  (lowerStatus === "paid" || lowerStatus === "approved") &&
                  moment(
                    record.billDate ? record.billDate : record.dueDate
                  )
                    .add(termDays, "days")
                    .diff(moment(), "days") <= AUTO_RENEW_THRESHOLD
                    ? payload.due_date
                    : item.dueDate,
                penalty:
                  (lowerStatus === "paid" || lowerStatus === "approved") &&
                  moment(
                    record.billDate ? record.billDate : record.dueDate
                  )
                    .add(termDays, "days")
                    .diff(moment(), "days") <= AUTO_RENEW_THRESHOLD
                    ? 0
                    : item.penalty,
                totalDue:
                  (lowerStatus === "paid" || lowerStatus === "approved") &&
                  moment(
                    record.billDate ? record.billDate : record.dueDate
                  )
                    .add(termDays, "days")
                    .diff(moment(), "days") <= AUTO_RENEW_THRESHOLD
                    ? record.rentAmount
                    : item.totalDue,
              }
            : item
        )
      );
      message.success(
        `Bill generated! Total Due: ${record.rentAmount.toFixed(2)} Birr`
      );
    } catch (error) {
      console.error("Error generating bill:", error);
      message.error("Failed to generate bill");
    }
  };

  // ------------------------------------------------------------------
  // Submit the payment proof (an image URL) for the generated bill.
  // ------------------------------------------------------------------
  const submitProof = async () => {
    if (!proofLink.trim()) {
      message.error("Please enter a valid image link.");
      return;
    }
    try {
      if (!selectedRecord.billId) {
        message.error("Bill not generated. Generate the bill first.");
        return;
      }
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

  // ------------------------------------------------------------------
  // Approve payment for a given bill.
  // ------------------------------------------------------------------
  const handleApprove = useCallback(
    async (record) => {
      if (!record.billId) {
        message.error("Bill not generated. Cannot approve payment.");
        return;
      }
      try {
        await axios.patch(`${API_BASE}/rent/${record.billId}/approve`);
        setData((prevData) =>
          prevData.map((item) =>
            item.key === record.key ? { ...item, approved: true, status: "Paid" } : item
          )
        );
        message.success("Payment approved!");
      } catch (error) {
        console.error("Error approving payment:", error);
        message.error("Failed to approve payment");
      }
    },
    [setData]
  );

  // ------------------------------------------------------------------
  // Modal helper functions.
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // Helper to check if status is "paid" or "approved".
  // ------------------------------------------------------------------
  const isPaidOrApproved = (status) => {
    const lowerStatus = status.toLowerCase();
    return lowerStatus === "paid" || lowerStatus === "approved";
  };

  // ------------------------------------------------------------------
  // Render cell for "Generate Bill" column.
  // ------------------------------------------------------------------
  const renderGenerateBillCell = (record) => {
    // Calculations will re-run each render due to the "tick" state.
    if (record.billAutoTriggered && !record.billGenerated) {
      return <Tag color="orange">Auto Generating...</Tag>;
    }

    if (isPaidOrApproved(record.status)) {
      const termDays = parseInt(record.term, 10);
      const cycleStart = record.billDate
        ? moment(record.billDate)
        : moment(record.dueDate);
      const nextDueDate = cycleStart.clone().add(termDays, "days");
      const daysLeft = nextDueDate.diff(moment(), "days");
      return daysLeft > AUTO_RENEW_THRESHOLD ? (
        <Tag color="blue">{daysLeft} days left</Tag>
      ) : (
        <Tag color="orange">Auto Generating...</Tag>
      );
    } else {
      const daysLeft = moment(record.dueDate).diff(moment(), "days");
      return daysLeft <= AUTO_RENEW_THRESHOLD ? (
        record.billGenerated ? (
          <Tag color="green">Generated</Tag>
        ) : (
          <Tag color="orange">Auto Generating...</Tag>
        )
      ) : (
        <Tag color="blue">{daysLeft} days left</Tag>
      );
    }
  };

  // ------------------------------------------------------------------
  // Table column definitions.
  // ------------------------------------------------------------------
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
        render: (amount) => `${amount.toFixed(2)} Birr`,
      },
      {
        title: "Penalty",
        dataIndex: "penalty",
        key: "penalty",
        render: (penalty) => `${penalty.toFixed(2)} Birr`,
      },
      {
        title: "Total Due",
        dataIndex: "totalDue",
        key: "totalDue",
        render: (total) => `${total.toFixed(2)} Birr`,
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status) => {
          const lowerStatus = status.toLowerCase();
          const color = isPaidOrApproved(status)
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

  // ------------------------------------------------------------------
  // Component render.
  // ------------------------------------------------------------------
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

      {/* Modal for RentInfo Details */}
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
