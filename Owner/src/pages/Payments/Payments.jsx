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
import { useAuth } from "../../context/AuthContext"; // Import useAuth

dayjs.extend(minMax);

// Define utility types with their labels and corresponding tenant payment fields.
const utilityTypes = [
  { key: "electricity", label: "EEU", paymentField: "eeu_payment" },
  { key: "water", label: "Water", paymentField: "water_payment" },
  { key: "generator", label: "Generator", paymentField: "generator_payment" },
];

// Base API URL.
// Ensure this matches the one used in Rent.js and Tenants.js if they are different
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"; // Use provided env variable or default

const Payments = () => {
  // State to hold ALL fetched data before filtering
  const [allTenants, setAllTenants] = useState([]);
  const [allUsage, setAllUsage] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [allStalls, setAllStalls] = useState([]); // Added state for all stalls

  // State for filtered data to be displayed
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);

  const [loading, setLoading] = useState(false);

  // Modal visibility states
  const [isUtilityModalVisible, setIsUtilityModalVisible] = useState(false);
  const [isProofModalVisible, setIsProofModalVisible] = useState(false);
  const [isBillModalVisible, setIsBillModalVisible] = useState(false);

  // Selected tenant and form controls
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [form] = Form.useForm(); // For Utility Meter Reading
  const [proofForm] = Form.useForm(); // For Payment Proof Upload
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get buildingId from auth context
  const { buildingId, authLoading } = useAuth();


  // ---------------------------
  // Fetch ALL tenants, utility usage, rooms, and stalls.
  // Also call penalty–update endpoint globally.
  // ---------------------------
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);

      // Update overdue penalties before fetching data.
      // Assuming this endpoint updates penalties globally or infers based on request.
      // If it needs buildingId, this would need backend modification or adjustment here.
      await axios.put(`${API_BASE}/api/utilities/updatePenalties`);

      const [tenantsRes, usageRes, roomsRes, stallsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/tenants`), // Fetch ALL tenants
        axios.get(`${API_BASE}/api/utilities/tenant_utility_usage`), // Fetch ALL usage
        axios.get(`${API_BASE}/stalls/getRooms`), // Fetch ALL rooms
        axios.get(`${API_BASE}/stalls`), // Fetch ALL stalls (needed to filter rooms by building)
      ]);

      setAllTenants(tenantsRes.data);
      setAllUsage(usageRes.data);
      setAllRooms(roomsRes.data.flat()); // Flatten if necessary
      setAllStalls(stallsRes.data);

    } catch (error) {
      message.error("Failed to fetch all data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all data when component mounts or authLoading changes
  useEffect(() => {
    if (!authLoading) {
      fetchAllData();
    }
  }, [fetchAllData, authLoading]);


  // ---------------------------
  // Filter and merge data for display when base data or buildingId changes.
  // ---------------------------
  useEffect(() => {
    if (!buildingId) {
      // Clear displayed data if buildingId is not available
      setPayments([]);
      setFilteredPayments([]);
      return;
    }

    // Filter tenants by buildingId and active status
    const tenantsInBuilding = allTenants.filter(
      (tenant) => Number(tenant.building_id) === buildingId && Number(tenant.terminated) === 0
    );

    // Filter utility usage by buildingId (assuming utility usage has building_id)
    // ALTERNATIVELY: Filter utility usage by the IDs of tenantsInBuilding if usage doesn't have building_id
    const usageInBuilding = allUsage.filter(
      (usage) => {
           // Option 1: Filter directly by building_id on usage record (if available)
           // return Number(usage.building_id) === buildingId;
           // Option 2: Filter by checking if the tenant_id exists in the filtered tenants list
           return tenantsInBuilding.some(tenant => Number(tenant.tenant_id) === Number(usage.tenant_id));
        }
    );

    // Filter stalls by buildingId
    const stallsInBuilding = allStalls.filter(
      (stall) => Number(stall.building_id) === buildingId
    );
    const stallIdsInBuilding = stallsInBuilding.map(stall => stall.id);


    // Filter rooms by their associated stall's buildingId
    const roomsInBuilding = allRooms.filter(
      (room) => stallIdsInBuilding.includes(room.stall_id)
    );

    // Merge filtered tenants with their latest filtered utility usage and filtered room data.
    const mergedData = tenantsInBuilding.map((tenant) => {
      const usages = usageInBuilding.filter(
          (u) => Number(u.tenant_id) === Number(tenant.tenant_id)
        );
        const utilityRecords = {};
        usages.forEach((u) => {
          const key = u.utility_type;
          // Keep the latest usage record for each utility type
          if (!utilityRecords[key] || dayjs(u.bill_date).isAfter(dayjs(utilityRecords[key].bill_date))) {
            utilityRecords[key] = u;
          }
        });

        // Find the room for this tenant from the filtered rooms
        const room = roomsInBuilding.find((r) => Number(r.id) === Number(tenant.room));


        return {
          ...tenant,
          room: room || {},
          utility_usage: utilityRecords,
        };
      });

      setPayments(mergedData);
      setFilteredPayments(mergedData); // Initially filteredPayments is the same as payments
      console.log("Merged and Filtered tenant data:", mergedData);

  }, [allTenants, allUsage, allRooms, allStalls, buildingId]); // Depend on all data states and buildingId


  // ---------------------------
  // Pre-populate the Utility Modal's previous reading fields.
  // ---------------------------
// In the useEffect for pre-populating the utility modal's previous readings
// In the useEffect for pre-populating the utility modal's previous readings
useEffect(() => {
    if (selectedTenant && selectedTenant.utility_usage) {
      const fields = {};
      utilityTypes.forEach(({ key, paymentField }) => {
        if (selectedTenant[paymentField] && selectedTenant.utility_usage[key]) {
          fields[`${key}_previous`] = Number(selectedTenant.utility_usage[key].current_reading);
        } else if (selectedTenant[paymentField]) {
          // Use room's initial values for first-time readings
          let initialValue = 0;
          if (key === "electricity") {
            initialValue = selectedTenant.room?.eeuReader || 0; // Use room's eeuReader
          } else if (key === "water") {
            initialValue = selectedTenant.room?.water_reader || 0; // Use room's water_reader
          }
          fields[`${key}_previous`] = Number(initialValue);
        }
      });
      form.setFieldsValue(fields);
    }
  }, [selectedTenant, form]);
  // ---------------------------
  // Mark tenant's regular payment as paid.
  // Note: This endpoint likely operates on tenantId, which implicitly links to building.
  // If backend needs buildingId explicitly, modify this call.
  // ---------------------------
  const handleMarkAsPaid = async (tenantId) => {
    try {
      await axios.put(`${API_BASE}/api/tenants/${tenantId}/pay`);
      message.success("Payment marked as Paid!");
      fetchAllData(); // Refetch all data to update the table
    } catch (error) {
      message.error("Failed to update payment status");
      console.error(error);
    }
  };

  // ---------------------------
  // Search tenants by name or payment date (filters the already filtered data).
  // ---------------------------
  const handleSearch = (filters) => {
    const filtered = payments.filter((payment) => { // Filter the already payments (filtered by buildingId)
      let matches = true;
      if (filters.tenantName) {
        matches = payment.full_name.toLowerCase().includes(filters.tenantName.toLowerCase());
      }
      // Note: PaymentDate filtering based on 'paymentDuty' needs careful consideration
      // as 'paymentDuty' is a derived field. You might need a different approach
      // if filtering by the *exact* payment duty date is critical and complex.
      // For now, keeping the existing logic which checks against the derived date.
      if (filters.paymentDate && payment.paymentDuty) { // Check if paymentDuty exists
        const searchDate = dayjs(filters.paymentDate).startOf('day');
        const paymentDutyDate = dayjs(payment.paymentDuty).startOf('day');
        matches = matches && searchDate.isSame(paymentDutyDate, "day");
      }
      return matches;
    });
    // Display filtered results if found, otherwise show all payments for the building
    setFilteredPayments(filtered.length > 0 || (filters.tenantName || filters.paymentDate) ? filtered : payments);
  };

  // ---------------------------
  // Utility Meter Reading Modal (Bill Generation)
  // ---------------------------
  const showUtilityModal = (tenant) => {
    setSelectedTenant(tenant);
    form.resetFields();
    setIsUtilityModalVisible(true);
  };

  // Handle Utility Bill Submission (MODIFIED: Added building_id to payload)
  const handleUtilitySubmit = async () => {
      try {
        const values = await form.validateFields();
        if (!selectedTenant) throw new Error("No tenant selected");
        if (!buildingId) throw new Error("Building ID not available.");
  
        const payloads = [];
        utilityTypes.forEach(({ key, paymentField, label }) => {
          // Only generate bill for utilities the tenant is configured to pay for
          if (selectedTenant[paymentField]) {
            const currentVal = values[`${key}_current`];
            if (currentVal === undefined) {
              // Skip if no reading entered for a utility the tenant pays for
              console.warn(`Skipping ${label} bill generation: Current reading is undefined.`);
              return;
            }
            payloads.push({
              tenant_id: selectedTenant.tenant_id,
              utility_type: key,
              current_reading: currentVal,
              building_id: buildingId, // Added building_id to payload - REQUIRED for multi-tenancy
            });
          }
        });
        if (payloads.length === 0) {
            message.info("No utility readings to submit for this tenant (or tenant is not configured for utility payments).");
            setIsUtilityModalVisible(false);
            return;
        }
        await Promise.all(
          payloads.map((payload) =>
            axios.post(`${API_BASE}/api/utilities/usage`, payload)
          )
        );
        message.success("Utility records created!");
        fetchAllData(); // Refetch all data to update the table
        setIsUtilityModalVisible(false);
      } catch (error) {
        console.error("Submission error:", error);
        message.error("Failed to submit utility readings: " + error.message);
      }
    };
  // ---------------------------
  // Payment Proof Upload Modal (Tenant Side)
  // Note: This endpoint likely needs usage_id, which links to the bill/tenant/building.
  // If backend needs buildingId explicitly, modify this call.
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
            (usage.utility_status === "Bill Generated" || usage.utility_status === "Overdue") && // Allow submitting proof for overdue bills
            values[`${key}_payment_proof_link`]
          ) {
            submissionPromises.push(
              axios.post(`${API_BASE}/api/utilities/confirm`, {
                tenant_id: selectedTenant.tenant_id, // Include tenant_id for backend lookup if needed
                usage_id: usage.id,
                payment_proof_link: values[`${key}_payment_proof_link`],
              })
            );
          }
        }
      });
      if (submissionPromises.length > 0) {
        await Promise.all(submissionPromises);
        message.success("Payment proofs submitted successfully. Await admin review.");
        fetchAllData(); // Refetch all data to update the table
      } else {
          message.info("No pending bills to submit proof for.");
      }

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
  // Note: This endpoint likely needs usage_id, which links to the bill/tenant/building.
  // If backend needs buildingId explicitly, modify this call.
  // ---------------------------
  const showBillModal = (tenant) => {
    setSelectedTenant(tenant);
    setIsBillModalVisible(true);
  };

   const handleApproveProof = async () => {
      try {
        if (!selectedTenant) throw new Error("No tenant selected");
        if (!buildingId) throw new Error("Building ID not available."); // Ensure buildingId is available
  
        const approvalPromises = [];
        if (selectedTenant.utility_usage) {
          Object.values(selectedTenant.utility_usage).forEach((usage) => {
            if (usage.utility_status === "Submitted") {
              approvalPromises.push(
                axios.post(`${API_BASE}/api/utilities/approve`, {
                  usage_id: usage.id,
                  building_id: buildingId, // ADDED building_id to approve payload
                })
              );
            }
          });
        }
        if (approvalPromises.length > 0) {
          await Promise.all(approvalPromises);
          message.success("Payment proofs approved successfully!");
          fetchAllData(); // Refetch all data to update the table
        } else {
          message.info("No submitted proofs available for approval for this tenant.");
        }
        setIsBillModalVisible(false);
      } catch (error) {
        console.error("Error approving proof:", error);
        message.error("Failed to approve payment proof(s): " + error.message); // Added error message display
      }
    };
  
  // ---------------------------
  // Render functions for table columns.
  // ---------------------------
  const renderUtilitySection = (record) => {
    // Check if the tenant is configured to pay for any utility
    const paysForAnyUtility = utilityTypes.some(ut => record[ut.paymentField]);

    if (!paysForAnyUtility) {
        return <Tag color="default">N/A</Tag>;
    }

    const hasUsage = record.utility_usage && Object.keys(record.utility_usage).length > 0;

    // Determine if any utility bill is overdue or due within 10 days (excluding approved ones)
    const needsNewBill = utilityTypes.some(({ key, paymentField }) => {
        if (!record[paymentField]) return false; // Tenant doesn't pay for this utility

        const usage = record.utility_usage?.[key];
        if (!usage) return true; // Tenant pays, but no bill generated yet

        if (usage.utility_status === "Approved") return false; // Already approved, wait for next cycle? Or next bill trigger?

        const dueDate = dayjs(usage.due_date);
        const diffDays = dueDate.diff(dayjs(), "day");

        return diffDays <= 10; // Due within 10 days or overdue
    });


    if (needsNewBill) {
      return (
        <Button icon={<CheckCircleOutlined />} onClick={() => showUtilityModal(record)}>
          Generate Bill
        </Button>
      );
    } else if (hasUsage) { // If bills exist and none need generation, allow viewing
        return (
        <Button type="link" onClick={() => showBillModal(record)}>
          View Bill
        </Button>
      );
    }

    return <Tag color="default">No Bills</Tag>; // Should ideally be covered by needsNewBill logic for tenants who pay
  };


  // The Due Info column now shows info for each utility if applicable.
  const renderDueInfoCombined = (record) => {
    if (record.utility_usage && Object.keys(record.utility_usage).length > 0) {
      return utilityTypes
        .filter(({ key, paymentField }) => record[paymentField]) // Only show utilities the tenant pays for
        .map(({ key, label }) => {
          const usage = record.utility_usage[key];
          if (!usage) return `${label}: No Bill`; // Tenant pays, but no bill generated yet

          const dueDate = dayjs(usage.due_date);
          const diffDays = dueDate.diff(dayjs(), "day");

          if (usage.utility_status === "Approved") {
            // For approved bills, show Paid status
            return `${label}: Paid`;
          } else if (diffDays >= 0) {
              return `${label}: ${diffDays} day(s) left (${dueDate.format("YYYY-MM-DD")})`;
          } else {
              return `${label}: Overdue by ${Math.abs(diffDays)} day(s)`;
          }
        })
        .join(" | ");
    } else {
       // If no utility usage records exist at all, show info based on payment duty for rent?
       // Or show N/A for utilities
       const paysForAnyUtility = utilityTypes.some(ut => record[ut.paymentField]);
       if (paysForAnyUtility) {
           return utilityTypes
               .filter(({ key, paymentField }) => record[paymentField])
               .map(({label}) => `${label}: No Bill`).join(" | ");
       }
       return "-"; // No utilities configured or no bills/usage yet
    }
  };

  const renderPenaltyCombined = (record) => {
    if (record.utility_usage && Object.keys(record.utility_usage).length > 0) {
      return utilityTypes
         .filter(({ key, paymentField }) => record[paymentField]) // Only show penalties for utilities tenant pays for
         .map(({ key, label }) => {
          const usage = record.utility_usage[key];
           if (!usage) return `${label}: -`;
          return `${label}: birr${Number(usage.penalty || 0).toFixed(2)}`;
        })
        .join(" | ");
    }
    return "-";
  };

  const renderUtilityStatusCombined = (record) => {
    if (record.utility_usage && Object.keys(record.utility_usage).length > 0) {
      return utilityTypes
         .filter(({ key, paymentField }) => record[paymentField]) // Only show status for utilities tenant pays for
         .map(({ key, label }) => {
          const usage = record.utility_usage[key];
           if (!usage) return `${label}: No Bill`;
          return `${label}: ${usage.utility_status}`;
        })
        .join(" | ");
    } else {
       const paysForAnyUtility = utilityTypes.some(ut => record[ut.paymentField]);
       if (paysForAnyUtility) {
           return utilityTypes
               .filter(({ key, paymentField }) => record[paymentField])
               .map(({label}) => `${label}: No Bill`).join(" | ");
       }
       return "-"; // No utilities configured or no bills/usage yet
    }
  };

  const renderActionsCombined = (record) => {
    const actions = [];

    // Action for regular Rent Payment (if status is 'Unpaid')
    // Note: This status 'Unpaid' seems related to the primary rent payment, not utility bills
    // If you use a different system for rent payments vs utility payments, adjust here.
    if (record.status === "Unpaid") {
      actions.push(
        <Button key="pay" type="link" onClick={() => handleMarkAsPaid(record.id)}>
          Mark Rent Paid
        </Button>
      );
    }

    // Actions for Utility Payments (Proof Upload/View & Approve)
    if (record.utility_usage && Object.values(record.utility_usage).some(usage => usage.utility_status === "Bill Generated" || usage.utility_status === "Overdue")) {
      actions.push(
        <Button key="upload" type="link" onClick={() => showProofModal(record)}>
          Upload Utility Proof
        </Button>
      );
    }
    if (record.utility_usage && Object.values(record.utility_usage).some(usage => usage.utility_status === "Submitted")) {
      actions.push(
        <Button key="view-approve" type="link" onClick={() => showBillModal(record)}>
          View & Approve Utility Proof
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
    // Assuming payment_term here refers to the primary rent payment term
    { title: "Rent Payment Term", dataIndex: "payment_term", key: "payment_term", align: "center" },
    {
      title: "Rent Payment Duty",
      key: "paymentDuty",
      render: (_, record) => {
        // This calculates the next *rent* payment duty based on lease start and payment term
        if (record.rent_start_date && record.payment_term) {
          // Find the most recent payment duty date that is in the past or today
          let lastDutyDate = dayjs(record.rent_start_date);
          const now = dayjs();
          while (lastDutyDate.add(record.payment_term, 'day').isBefore(now, 'day') || lastDutyDate.add(record.payment_term, 'day').isSame(now, 'day')) {
            lastDutyDate = lastDutyDate.add(record.payment_term, 'day');
          }
          const nextDutyDate = lastDutyDate.add(record.payment_term, 'day');

          return nextDutyDate.isValid()
            ? nextDutyDate.format("YYYY-MM-DD")
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
    // Payment Proof column simplified to show proof button if any utility proof exists
    {
      title: "Utility Proof",
      key: "utility_payment_proof",
      render: (_, record) => {
            const hasAnyUtilityProof = record.utility_usage && Object.values(record.utility_usage).some(u => u.payment_proof_link);
            return hasAnyUtilityProof ? (
                <Button type="link" onClick={() => showBillModal(record)}>
                    View Proof
                </Button>
            ) : (
                "-"
            );
        },
      align: "center"
    },
    { title: "Penalty", key: "penalty", render: (_, record) => renderPenaltyCombined(record), align: "center" },
    { title: "Due Info", key: "dueInfo", render: (_, record) => renderDueInfoCombined(record), align: "center" },
    { title: "Actions", key: "actions", render: (_, record) => renderActionsCombined(record), align: "center" },
  ];

  return (
    <div style={{ padding: '20px' }}>
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
        dataSource={filteredPayments} // Use filteredPayments for the table data source
        rowKey="id"
        loading={loading}
      />

      {/* Utility Meter Reading Modal */}
      <Modal
        title={`Enter Utility Meter Readings for ${selectedTenant?.full_name || ''}`}
        visible={isUtilityModalVisible}
        onCancel={() => setIsUtilityModalVisible(false)}
        onOk={handleUtilitySubmit}
      >
        <Form form={form} layout="vertical">
          {selectedTenant && utilityTypes.map(({ key, label, paymentField }) => {
            // Only show fields for utilities this tenant is responsible for
            if (selectedTenant[paymentField]) {
              const previousUsage = selectedTenant.utility_usage?.[key];
              // Use the latest reading from usage if available, otherwise use the initial reading from tenant record
              const previousReading = previousUsage
                ? Number(previousUsage.current_reading)
                : Number(selectedTenant[`last_${key}_reading`] || 0);

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
                        message: `Please enter the current reading for ${label}`,
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                             const previous = getFieldValue(`${key}_previous`); // Get the previous reading from the form
                          if (value === undefined || value === null || value === '') {
                                 return Promise.reject(new Error(`Please enter the current reading for ${label}`));
                             }
                             if (Number(value) < Number(previous)) {
                            return Promise.reject(new Error(`Current reading must be ≥ previous reading (${previous})`));
                          }
                             return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <InputNumber
                      min={previousReading} // Set min based on the dynamically fetched previous reading
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
        title={`Upload Payment Proof for ${selectedTenant?.full_name || ''}`}
        visible={isProofModalVisible}
        onCancel={() => setIsProofModalVisible(false)}
        onOk={handleProofSubmit}
        confirmLoading={isSubmitting}
      >
        <Form form={proofForm} layout="vertical">
          {selectedTenant && utilityTypes.map(({ key, label, paymentField }) => {
            // Only show fields for utilities this tenant is responsible for and has a bill for
            if (selectedTenant[paymentField] && selectedTenant.utility_usage?.[key]) {
                 const usage = selectedTenant.utility_usage[key];
                 // Only show if the bill status is 'Bill Generated' or 'Overdue'
                 if (usage.utility_status === "Bill Generated" || usage.utility_status === "Overdue") {
                  return (
                    <React.Fragment key={key}>
                      <Form.Item label={`${label} Bill Due Date`}>
                        <Input value={dayjs(usage.due_date).format("YYYY-MM-DD")} disabled style={{ background: "#f5f5f5" }} />
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
              }
            return null;
          })}
            {selectedTenant && !utilityTypes.some(({ key, paymentField }) =>
                selectedTenant[paymentField] &&
                selectedTenant.utility_usage?.[key] &&
                (selectedTenant.utility_usage[key].utility_status === "Bill Generated" || selectedTenant.utility_usage[key].utility_status === "Overdue")
            ) && (
                <p>No utility bills are currently ready for payment proof submission for this tenant.</p>
            )}
        </Form>
      </Modal>

      {/* View Bill / Approve Payment Proof Modal */}
      <Modal
        title={`Utility Bills for ${selectedTenant?.full_name || ''}`}
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
        width={700} // Increased width for better display of multiple utility details
        bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }}
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
                 {/* Display readings if available */}
                 {usage.previous_reading !== undefined && usage.current_reading !== undefined && (
                     <p>
                         <strong>Readings:</strong> {usage.previous_reading} to {usage.current_reading}
                     </p>
                 )}
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
                      {/* Check if the link is for an image before rendering img tag */}
                         {usage.payment_proof_link.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                            <img
                            src={usage.payment_proof_link}
                            alt={`${label} Payment Proof`}
                            style={{ width: "100%" }}
                          />
                         ) : (
                            <a href={usage.payment_proof_link} target="_blank" rel="noopener noreferrer">View Proof Link</a>
                         )}
                    </div>
                  ) : (
                    <p>No Payment Proof Submitted for {label}.</p>
                  )}
                </div>
              ) : null;
            })}
             {selectedTenant && !utilityTypes.some(({ key, paymentField }) =>
                 selectedTenant[paymentField] && selectedTenant.utility_usage?.[key]
             ) && (
                 <p>This tenant does not have any generated utility bills yet.</p>
             )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Payments;
