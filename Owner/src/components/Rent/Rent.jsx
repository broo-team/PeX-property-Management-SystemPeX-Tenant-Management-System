import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import moment from "moment";
import { Table, Tag, Space, Button, Modal, message, Form, Input } from "antd";
import { FileDoneOutlined, CheckCircleOutlined, UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import RentInfo from "./RentInfo";

// Base API URL.
const API_BASE = "http://localhost:5000/api";
// Date format constant.
const DATE_FORMAT = "YYYY-MM-DD HH:mm:ss";

// Utility: Format currency.
const formatCurrency = (value) => `${parseFloat(value).toFixed(2)} Birr`;

// Utility: Check if status is paid or approved.
const isPaidOrApproved = (status) => {
  const lower = status.toLowerCase();
  return lower === "paid" || lower === "approved";
};

// Build a bill payload for a new tenant.
// This function computes the due date as now + full term (e.g. 30 days).
const buildGenerateBillPayload = (record) => {
  const termDays = record.paymentTerm || 30;
  const now = moment.utc();
  const tenantId = record.tenantId || record.id;

  const newDue = now.clone().add(termDays, "days").endOf("day").format(DATE_FORMAT);
  return {
    tenant_id: tenantId,
    bill_date: now.format("YYYY-MM-DD"),
    due_date: newDue,
    original_due_date: newDue,
    amount: record.rentAmount * (termDays / 30),
  };
};

const Rent = () => {
  const [data, setData] = useState([]);
  const [tick, setTick] = useState(0);
  const [modalImage, setModalImage] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [proofLink, setProofLink] = useState("");
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsRecord, setDetailsRecord] = useState(null);

  // We'll use this ref to store "locked" data for each tenant's current bill.
  const lockedBillData = useRef({});

  // Update tick every second.
  useEffect(() => {
    const interval = setInterval(() => setTick((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch tenants and bills and merge them.
  const fetchData = useCallback(async () => {
    try {
      const [tenantRes, billRes] = await Promise.all([
        axios.get(`${API_BASE}/tenants`),
        axios.get(`${API_BASE}/rent`)
      ]);
      const tenants = tenantRes.data;
      const bills = billRes.data;
      const activeTenants = tenants.filter((t) => Number(t.terminated) === 0);

      const mergedData = activeTenants.map((tenant) => {
        const termRaw = Number(tenant.payment_term) || 30;
        // If the payment term is less than or equal to 12, assume it represents months
        // and convert it to days; otherwise assume it's already in days.
        const termDays = termRaw > 12 ? termRaw : termRaw * 30;
        const termMonths = termRaw > 12 ? termRaw / 30 : termRaw;
        const monthlyRent = parseFloat(tenant.monthlyRent) || 0;
        const tenantId = tenant.tenant_id;
        // Find a bill for this tenant if it exists.
        const bill = bills.find((b) => b.tenant_id === tenantId);

        const base = {
          key: tenant.id.toString(),
          tenantId,
          name: tenant.full_name,
          room: tenant.roomName || tenant.room,
          paymentTerm: termDays,
          term: `${termDays} days`,
          rentAmount: monthlyRent,
          rent_start_date: tenant.rent_start_date,
          rent_end_date: tenant.rent_end_date,
          original_due_date: tenant.rent_end_date
            ? moment.utc(tenant.rent_end_date).endOf("day").format(DATE_FORMAT)
            : null,
        };

        if (bill) {
          let finalDueDate, storedDays;
          if (bill.payment_status.toLowerCase() !== "paid") {
            // For pending/submitted bills: check our locked data.
            if (lockedBillData.current[tenantId]) {
              finalDueDate = lockedBillData.current[tenantId].lockedDueDate;
              storedDays = lockedBillData.current[tenantId].lockedDaysLeft;
            } else {
              finalDueDate = bill.original_due_date ? bill.original_due_date : bill.due_date;
              storedDays = moment
                .utc(finalDueDate, DATE_FORMAT)
                .endOf("day")
                .diff(moment.utc(), "days");
              lockedBillData.current[tenantId] = {
                lockedDueDate: finalDueDate,
                lockedDaysLeft: storedDays,
              };
            }
          } else {
            // For paid bills, simply use the backend value and clear any locked data.
            finalDueDate = bill.due_date;
            if (lockedBillData.current[tenantId]) {
              delete lockedBillData.current[tenantId];
            }
            storedDays = moment
              .utc(finalDueDate, DATE_FORMAT)
              .endOf("day")
              .diff(moment.utc(), "days");
          }
          const billDate = moment.utc(bill.bill_date, DATE_FORMAT);
          return {
            ...base,
            billId: bill.id,
            lockedDueDate: finalDueDate,
            dueDate: finalDueDate,
            billDate: billDate.format(DATE_FORMAT),
            penalty: parseFloat(bill.penalty) || 0,
            totalDue: parseFloat(bill.amount) + (parseFloat(bill.penalty) || 0),
            status:
              bill.payment_status.charAt(0).toUpperCase() +
              bill.payment_status.slice(1),
            proof: bill.payment_proof_url || "",
            approved: isPaidOrApproved(bill.payment_status),
            billGenerated: true,
            billAutoTriggered: false,
            daysLeft: storedDays,
            initialDaysLeft: bill.initial_days_left || termDays,
            // Determine if this is considered a "first bill" by checking the cycle length.
            isFirstBill:
              moment.utc(finalDueDate, DATE_FORMAT).diff(billDate, "days") >
              termDays / 2,
          };
        } else {
          // For a tenant with no existing bill, display the full term.
          const dueDate = moment.utc()
            .add(termDays, "days")
            .endOf("day")
            .format(DATE_FORMAT);
          return {
            ...base,
            billId: null,
            dueDate,
            billDate: dueDate,
            penalty: 0,
            totalDue: monthlyRent * termMonths,
            status: "Pending",
            proof: "",
            approved: false,
            billGenerated: false,
            billAutoTriggered: false,
            daysLeft: termDays,
            initialDaysLeft: termDays,
            isFirstBill: true,
          };
        }
      });

      setData(mergedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Failed to load rental data");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Periodically update overdue bills.
  useEffect(() => {
    const updateOverdue = async () => {
      try {
        await axios.patch(`${API_BASE}/rent/updateOverdue`, {});
        fetchData();
      } catch (error) {
        console.error("Error updating overdue bills:", error);
      }
    };
    const intervalId = setInterval(updateOverdue, 60000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  // Generate a bill.
  const generateBill = useCallback(
    async (record, isFirstBill = false) => {
      const rStart = record.rent_start_date ? moment.utc(record.rent_start_date) : null;
      if (rStart && rStart.isAfter(moment.utc())) {
        message.info("Lease has not started. Bill generation is disabled.");
        setData((prev) =>
          prev.map(item =>
            item.key === record.key ? { ...item, billAutoTriggered: false } : item
          )
        );
        return;
      }
      try {
        let payload;
        if (!record.billId) {
          // New tenant bill generation.
          payload = buildGenerateBillPayload(record);
        } else {
          // Renewal: use the tenant's payment term for a full new cycle.
          const fullCycleDue = moment.utc()
            .add(record.paymentTerm, "days")
            .endOf("day")
            .format(DATE_FORMAT);
          payload = {
            tenant_id: record.tenantId,
            bill_date: moment.utc().format("YYYY-MM-DD"),
            due_date: fullCycleDue,
            original_due_date: fullCycleDue,
            amount: record.rentAmount,
          };
        }
        console.log("Generating Bill with payload:", payload);
        const res = await axios.post(`${API_BASE}/rent/generate`, payload);
        console.log("Generate bill response:", res.data);
        const finalDue = payload.due_date;
        const newDays = moment.utc(finalDue, DATE_FORMAT)
          .endOf("day")
          .diff(moment.utc(), "days");
        // Store the locked data.
        lockedBillData.current[record.tenantId] = {
          lockedDueDate: finalDue,
          lockedDaysLeft: newDays,
        };
        setData((prev) =>
          prev.map(item =>
            item.key === record.key
              ? {
                  ...item,
                  billGenerated: true,
                  billAutoTriggered: false,
                  status: "Pending",
                  billId: res.data.billId,
                  lockedDueDate: finalDue,
                  dueDate: finalDue,
                  daysLeft: newDays,
                  isFirstBill,
                }
              : item
          )
        );
      } catch (error) {
        console.error("Bill generation failed:", error);
        message.error("Failed to generate bill.");
      }
    },
    []
  );

  // Auto-generate bills.
  // For new tenants, if no bill exists, generate a bill.
  // For renewals, trigger generation when the previous bill is marked as "paid"
  // and when there are 10 or fewer days remaining until the next due date.
  const autoGenerateBills = useCallback(() => {
    const now = moment.utc().endOf("day");
    data.forEach((record) => {
      // For a new tenant.
      if (
        !record.billId &&
        !record.billAutoTriggered &&
        moment.utc(record.rent_start_date).isSameOrBefore(now)
      ) {
        setData((prev) =>
          prev.map((item) =>
            item.key === record.key ? { ...item, billAutoTriggered: true } : item
          )
        );
        generateBill(record, true).catch((error) => {
          console.error("Initial generation failed:", error);
          setData((prev) =>
            prev.map((item) =>
              item.key === record.key
                ? { ...item, billAutoTriggered: false, billGenerated: false }
                : item
            )
          );
        });
      }
      // For renewals – trigger only if the previous bill is marked "paid".
      else if (
        record.billId &&
        record.status.toLowerCase() === "paid" &&
        !record.billAutoTriggered
      ) {
        const due = moment.utc(record.dueDate, DATE_FORMAT).endOf("day");
        const remaining = due.diff(now, "days");
        // Trigger renewal when there are 10 or fewer days left.
        if (remaining <= 10) {
          setData((prev) =>
            prev.map((item) =>
              item.key === record.key ? { ...item, billAutoTriggered: true } : item
            )
          );
          generateBill(record, false).catch((error) => {
            console.error("Renewal generation failed:", error);
            setData((prev) =>
              prev.map((item) =>
                item.key === record.key
                  ? { ...item, billAutoTriggered: false, billGenerated: false }
                  : item
              )
            );
          });
        }
      }
    });
  }, [data, generateBill]);

  useEffect(() => {
    autoGenerateBills();
  }, [tick, autoGenerateBills]);

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
      await axios.patch(`${API_BASE}/rent/${selectedRecord.billId}/proof`, {
        proof_url: proofLink,
      });
      setData((prev) =>
        prev.map((item) =>
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
    if (record.status.toLowerCase() !== "submitted") {
      message.info("Payment is already processed or not submitted.");
      return;
    }
    try {
      await axios.patch(`${API_BASE}/rent/${record.billId}/approve`);
      const now = moment.utc();
      const currentDue = moment.utc(record.dueDate, DATE_FORMAT);
      let penaltyDays = 0;
      if (now.isAfter(currentDue)) {
        penaltyDays = now.diff(currentDue, "days");
      }
      const newRemaining = record.paymentTerm - penaltyDays;
      const newDue = moment
        .utc()
        .add(newRemaining > 0 ? newRemaining : 0, "days")
        .endOf("day")
        .format(DATE_FORMAT);

      // Clear any locked data for this tenant.
      if (lockedBillData.current[record.tenantId]) {
        delete lockedBillData.current[record.tenantId];
      }

      setData((prev) =>
        prev.map((item) =>
          item.key === record.key
            ? {
                ...item,
                status: "Paid",
                approved: true,
                daysLeft: newRemaining > 0 ? newRemaining : 0,
                dueDate: newDue,
              }
            : item
        )
      );
      message.success("Payment approved!");
    } catch (error) {
      console.error("Error approving payment:", error);
      message.error(
        error.response?.data?.error || "Failed to approve payment"
      );
    }
  }, []);

  // Render the "Generate Bill" cell.
  // Now, even if the bill's status is "Paid", we display the remaining days.
  const renderGenerateBillCell = (record) => {
    if (
      record.rent_start_date &&
      moment.utc(record.rent_start_date, DATE_FORMAT).isAfter(moment.utc())
    )
      return <Tag color="grey">Lease Not Started</Tag>;

    if (record.billGenerated) {
      if (record.daysLeft >= 0) {
        if (record.status.toLowerCase() === "paid") {
          return (
            <Tag style={{ background: 'linear-gradient(to right, #6a11cb, #2575fc)', color: 'white' }}>
              {record.daysLeft} days left
            </Tag>
          );
          
        } else {
          return <Tag color="blue">{record.daysLeft} days left</Tag>;
        }
      } else {
        return <Tag color="red">Overdue</Tag>;
      }
    }

    if (!record.billId) {
      const initialDays = record.daysLeft;
      return initialDays > record.paymentTerm ? (
        <Tag color="orange">Not Generated</Tag>
      ) : (
        <Tag color="orange">Auto Generating...</Tag>
      );
    }

    return isPaidOrApproved(record.status) ? (
      <Tag color="green">
        {record.status.charAt(0).toUpperCase() +
          record.status.slice(1)} - {record.daysLeft} days left
      </Tag>
    ) : (
      <Tag color="orange">Auto Generating...</Tag>
    );
  };

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
          const lower = status.toLowerCase();
          const color = isPaidOrApproved(status)
            ? "green"
            : lower === "pending"
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
          ) : record.status.toLowerCase() === "paid" ? (
            <Tag  color={record.proof === "chapa" ? "geekblue" : "lime"}>
  {record.proof === "chapa" ? "Paid Online" : "Approved"}
</Tag>

          ) : (
            <Tag color="red">Pending</Tag>
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
            buildingId={detailsRecord.building_id}
            isModal
            onClose={() => setDetailsModalVisible(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default Rent;
