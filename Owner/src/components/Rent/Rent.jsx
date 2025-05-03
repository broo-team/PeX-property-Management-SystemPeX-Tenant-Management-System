import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import moment from "moment";
import { Table, Tag, Space, Button, Modal, message, Form, Input } from "antd";
import { FileDoneOutlined, CheckCircleOutlined, UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import RentInfo from "./RentInfo"; // Assuming RentInfo is in the same directory
import { useAuth } from "../../context/AuthContext"; // Import useAuth

// Base API URL.
const API_BASE = "http://localhost:5000/api";
// Date format constant.
const DATE_FORMAT = "YYYY-MM-DD";

// Utility: Format currency.
const formatCurrency = (value) => `${parseFloat(value).toFixed(2)} Birr`;

// Utility: Check if status is paid or approved.
const isPaidOrApproved = (status) => {
  const lower = status.toLowerCase();
  return lower === "paid" || lower === "approved";
};

// Build a bill payload for a new tenant.
// This function computes the due date as now + full term (e.g. 30 days).
// MODIFIED: Added building_id to payload
const buildGenerateBillPayload = (record, buildingId) => {
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
    building_id: buildingId, // Added building_id
  };
};

const Rent = () => {
  const [data, setData] = useState([]); // Filtered data for the table
  const [allTenants, setAllTenants] = useState([]); // Holds all tenants fetched
  const [allBills, setAllBills] = useState([]); // Holds all bills fetched
  const [tick, setTick] = useState(0);
  const [modalImage, setModalImage] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [proofLink, setProofLink] = useState("");
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsRecord, setDetailsRecord] = useState(null);
const [proofFile, setProofFile] = useState(null);

  // Get buildingId from auth context
  const { buildingId, authLoading } = useAuth();

  // We'll use this ref to store "locked" data for each tenant's current bill.
  const lockedBillData = useRef({});

  // Update tick every second.
  useEffect(() => {
    const interval = setInterval(() => setTick((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch ALL tenants and ALL bills.
  const fetchAllData = useCallback(async () => {
    try {
      const [tenantRes, billRes] = await Promise.all([
        axios.get(`${API_BASE}/tenants`), // Fetch ALL tenants
        axios.get(`${API_BASE}/rent`) // Fetch ALL rent bills
      ]);
      setAllTenants(tenantRes.data);
      setAllBills(billRes.data);
    } catch (error) {
      console.error("Error fetching all data:", error);
      message.error("Failed to load data");
    }
  }, []);

  // Fetch all data when component mounts or authLoading changes.
  useEffect(() => {
    if (!authLoading) {
      fetchAllData();
    }
  }, [fetchAllData, authLoading]);

  // Merge and filter data when allTenants, allBills, or buildingId changes.
  useEffect(() => {
    if (!buildingId) {
      // Clear data if buildingId is not available
      setData([]);
      return;
    }

    // Filter tenants and bills by the current buildingId
    const tenantsInBuilding = allTenants.filter(
      (tenant) => Number(tenant.building_id) === buildingId && Number(tenant.terminated) === 0 // Only active tenants
    );

    const billsInBuilding = allBills.filter(
      (bill) => Number(bill.building_id) === buildingId
    );

    // Merge filtered tenants and bills
    const mergedData = tenantsInBuilding.map((tenant) => {
      const termRaw = Number(tenant.payment_term) || 30;
      // If the payment term is less than or equal to 12, assume it represents months
      // and convert it to days; otherwise assume it's already in days.
      const termDays = termRaw > 12 ? termRaw : termRaw * 30;
      const termMonths = termRaw > 12 ? termRaw / 30 : termRaw;
      const monthlyRent = parseFloat(tenant.monthlyRent) || 0;
      const tenantId = tenant.tenant_id;
      // Find a bill for this tenant in the filtered bills.
      const bill = billsInBuilding.find((b) => b.tenant_id === tenantId);

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
        // Include building_id in the merged data for easy access
        building_id: tenant.building_id,
      };

      if (bill) {
          let finalDueDate, storedDays;
          if (bill.payment_status.toLowerCase() !== "paid") {
            // For pending/submitted bills: check our locked data.
            if (lockedBillData.current[tenantId]) {
              finalDueDate = lockedBillData.current[tenantId].lockedDueDate;
              storedDays = moment
                .utc(finalDueDate, DATE_FORMAT)
                .endOf("day")
                .diff(moment.utc(), "days"); // Recalculate daysLeft based on current time
            } else {
              finalDueDate = bill.original_due_date ? bill.original_due_date : bill.due_date;
              storedDays = moment
                .utc(finalDueDate, DATE_FORMAT)
                .endOf("day")
                .diff(moment.utc(), "days");
              // Store the locked data.
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
            billAutoTriggered: false, // This will be updated by autoGenerateBills
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
            billDate: dueDate, // Using dueDate as billDate for display before generation
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
  }, [allTenants, allBills, buildingId, tick]); // Added tick dependency for daysLeft update


  // Periodically update overdue bills (MODIFIED: Ensure backend handles buildingId if necessary)
  // Note: This endpoint might need to be updated on the backend to use buildingId
  // if it's not already inferred from the user session or tenant data.
  const updateOverdue = useCallback(async () => {
    if (!buildingId) return;
      try {
        // If your backend updateOverdue endpoint needs buildingId, add it here:
        // await axios.patch(`${API_BASE}/rent/updateOverdue?buildingId=${buildingId}`, {});
        await axios.patch(`${API_BASE}/rent/updateOverdue`, {}); // Using original endpoint
        // After updating overdue status on backend, refetch all data to update frontend
        fetchAllData();
      } catch (error) {
        console.error("Error updating overdue bills:", error);
      }
  }, [buildingId, fetchAllData]);

  useEffect(() => {
    const intervalId = setInterval(updateOverdue, 60000); // Check every minute
    return () => clearInterval(intervalId);
  }, [updateOverdue]);


  // Generate a bill.
  const generateBill = useCallback(
    async (record, isFirstBill = false) => {
      if (!buildingId) {
        message.error("Building ID not available. Cannot generate bill.");
        return;
      }
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
          payload = buildGenerateBillPayload(record, buildingId); // Pass buildingId
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
            building_id: buildingId, // Added building_id
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
        // Refetch all data after generation to ensure table is up-to-date
        fetchAllData();

      } catch (error) {
        console.error("Bill generation failed:", error);
        message.error("Failed to generate bill.");
      }
    },
    [buildingId, fetchAllData] // Added buildingId and fetchAllData dependencies
  );

  // Auto-generate bills.
  // For new tenants, if no bill exists, generate a bill.
  // For renewals, trigger generation when the previous bill is marked as "paid"
  // and when there are 10 or fewer days remaining until the next due date.
  // This runs based on the `data` state, which is already filtered by buildingId.
  const autoGenerateBills = useCallback(() => {
    const now = moment.utc().endOf("day");
    data.forEach((record) => {
      // For a new tenant.
      if (
        !record.billId &&
        !record.billAutoTriggered &&
        moment.utc(record.rent_start_date).isSameOrBefore(now)
      ) {
          // Set a flag to prevent multiple auto-triggers for the same bill
        setData((prev) =>
          prev.map((item) =>
            item.key === record.key ? { ...item, billAutoTriggered: true } : item
          )
        );
        generateBill(record, true).catch((error) => {
          console.error("Initial generation failed:", error);
          // Reset the flag if generation fails
          setData((prev) =>
            prev.map((item) =>
              item.key === record.key
                ? { ...item, billAutoTriggered: false, billGenerated: false }
                : item
            )
          );
        });
      }
      // For renewals – trigger only if the previous bill is marked "paid"
      // and when there are 10 or fewer days remaining until the next due date.
      else if (
        record.billId &&
        record.status.toLowerCase() === "paid" &&
        !record.billAutoTriggered
      ) {
        const due = moment.utc(record.dueDate, DATE_FORMAT).endOf("day");
        const remaining = due.diff(now, "days");
        // Trigger renewal when there are 10 or fewer days left.
        if (remaining <= 10) {
           // Set a flag to prevent multiple auto-triggers for the same bill
          setData((prev) =>
            prev.map((item) =>
              item.key === record.key ? { ...item, billAutoTriggered: true } : item
            )
          );
          generateBill(record, false).catch((error) => {
            console.error("Renewal generation failed:", error);
            // Reset the flag if generation fails
            setData((prev) =>
              prev.map((item) =>
                item.key === record.key
                  ? { ...item, billAutoTriggered: false, billGenerated: false }
                  : item
              )
          )});
        }
      }
    });
  }, [data, generateBill]); // Dependency on data ensures it reacts to state changes

  useEffect(() => {
    // autoGenerateBills depends on `data`, which updates via `tick` implicitly
    // by recalculating daysLeft and potentially triggering the auto-generation logic.
    autoGenerateBills();
  }, [tick, autoGenerateBills]);
  // Submit payment proof.
  // Note: This endpoint likely doesn't need buildingId if the billId is sufficient
  // for the backend to identify the bill and associated building/tenant.
// Update submitProof to use FormData and send the file
const submitProof = async () => {
    if (!proofFile) {
      message.error("Please select a file to upload.");
      return;
    }
    if (!selectedRecord?.billId) {
      message.error("Bill not generated. Generate the bill first.");
      return;
    }
  
    const formData = new FormData();
    formData.append("payment_proof", proofFile); // Ensure backend matches this key
  
    try {
      await axios.patch(
        `${API_BASE}/rent/${selectedRecord.billId}/proof`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      fetchAllData(); // Refresh data after success
      setProofModalVisible(false);
      setProofFile(null);
      message.success("Payment proof submitted successfully!");
    } catch (error) {
      console.error("Error submitting payment proof:", error);
      message.error("Failed to submit payment proof");
    }
  };
  // Approve payment.
  // Note: This endpoint likely doesn't need buildingId if the billId is sufficient.
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
      // After approval, refetch all data to update the table
      fetchAllData();
      message.success("Payment approved!");
    } catch (error) {
      console.error("Error approving payment:", error);
      message.error(
        error.response?.data?.error || "Failed to approve payment"
      );
    }
  }, [fetchAllData]); // Dependency on fetchAllData


  // Render the "Generate Bill" cell.
  // Now, even if the bill's status is "Paid", we display the remaining days.
  const renderGenerateBillCell = (record) => {
    if (
      record.rent_start_date &&
      moment.utc(record.rent_start_date).isAfter(moment.utc()) // Parse without format for comparison
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

    // If no bill is generated and rent start date is in the past or today
    if (!record.billId && moment.utc(record.rent_start_date).isSameOrBefore(moment.utc())) {
       // Check if auto-generation is already triggered to avoid multiple triggers
       // This check is now primarily handled within autoGenerateBills logic
        return <Tag color="orange">Pending Generation</Tag>;
    }
    // If no bill generated and rent start date is in the future
    if (!record.billId && moment.utc(record.rent_start_date).isAfter(moment.utc())) {
        return <Tag color="grey">Lease Not Started</Tag>;
    }


    return isPaidOrApproved(record.status) ? (
      <Tag color="green">
        {record.status.charAt(0).toUpperCase() +
          record.status.slice(1)} - {record.daysLeft} days left
      </Tag>
    ) : (
      <Tag color="orange">Pending</Tag> // Default tag for other non-paid/approved statuses
    );
  };

  const columns = useMemo(
    () => [
      { title: "Tenant Name", dataIndex: "name", key: "name" },
      { title: "Room", dataIndex: "room", key: "room" },
      { title: "Payment Term", dataIndex: "term", key: "term" },
      {
        title: "Next Due Date",
        dataIndex: "dueDate",
        key: "dueDate",
        render: (date) => date ? moment.utc(date, DATE_FORMAT).format("YYYY-MM-DD") : "N/A"
       },
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
            : lower === "pending" || lower === "submitted"
            ? "blue" // Use blue for both pending and submitted before proof check
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
                  disabled={!record.billGenerated || record.status.toLowerCase() !== 'pending'} // Disable if bill not generated or not pending
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
            <Tag  color={record.proof === "chapa" ? "geekblue" : "lime"}>
  {record.proof === "chapa" ? "Paid Online" : "Approved"}
</Tag>

          ) : (
            <Tag color="red">Pending</Tag>
          ),
      },
    ],
    [data, handleApprove]
  ); // Added data dependency for columns to reflect daysLeft updates

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
  onCancel={() => {
    setProofModalVisible(false);
    setProofFile(null);
  }}
  footer={[
    <Button key="cancel" onClick={() => {
      setProofModalVisible(false);
      setProofFile(null);
    }}>
      Cancel
    </Button>,
    <Button
    key="submit"
    type="primary"
    icon={<UploadOutlined />}
    onClick={submitProof}
    disabled={!proofFile} // Only enable if file is selected
  >
    Upload
  </Button>
  ]}
>
  <Form layout="vertical">
    <Form.Item label="Upload File" required>
      <Input
        type="file"
        accept="image/*"
        onChange={(e) => setProofFile(e.target.files[0])}
      />
    </Form.Item>
  </Form>
</Modal>

      {/* Modal for Viewing Payment Proof */}
     <Modal
  visible={modalVisible}
  footer={[
    <Button key="close" onClick={() => setModalVisible(false)}>
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
    )
  ]}
  onCancel={() => setModalVisible(false)}
>
<img 
    src={`${API_BASE.replace('/api', '')}/${modalImage}`} 
    alt="Payment Proof" 
    style={{ width: "100%", maxHeight: "60vh", objectFit: "contain" }} 
  />
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