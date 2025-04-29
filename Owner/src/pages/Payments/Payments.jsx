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
  Tag, // Import Tag
} from "antd";
import dayjs from "dayjs";
import { CheckCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import minMax from 'dayjs/plugin/minMax';
import { useAuth } from "../../context/AuthContext"; // Corrected import path if needed


dayjs.extend(minMax);

// Define utility types with their labels and corresponding tenant payment fields.
const utilityTypes = [
  { key: "electricity", label: "EEU", paymentField: "eeu_payment" },
  { key: "water", label: "Water", paymentField: "water_payment" },
  { key: "generator", label: "Generator", paymentField: "generator_payment" },
];


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


  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      // Attempt to update penalties first - allow it to fail without stopping the fetch
      try {
         await axios.put(`${API_BASE}/api/utilities/updatePenalties`);
      } catch (penaltyError) {
          console.error("Failed to update penalties:", penaltyError);
          // message.warning("Failed to update penalties, data might be slightly out of date."); // Optional: show a warning
      }


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

      console.log("fetchAllData completed. Tenants:", tenantsRes.data.length, "Usage Records:", usageRes.data.length);


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


  useEffect(() => {
    if (!buildingId) {
      setPayments([]);
      setFilteredPayments([]);
      return;
    }

    const tenantsInBuilding = allTenants.filter(
      (tenant) => Number(tenant.building_id) === buildingId && Number(tenant.terminated) === 0
    );

    // Filter usage data relevant to tenants in the current building
    const usageInBuilding = allUsage.filter((usage) =>
      tenantsInBuilding.some((tenant) => String(tenant.tenant_id) === String(usage.tenant_id)) // Compare tenant_id as strings
    );

    const stallsInBuilding = allStalls.filter(
      (stall) => Number(stall.building_id) === buildingId
    );
    const stallIdsInBuilding = stallsInBuilding.map((stall) => stall.id);
    const roomsInBuilding = allRooms.filter((room) =>
      stallIdsInBuilding.includes(room.stall_id)
    );

    // In the useEffect where data is merged
    const mergedData = tenantsInBuilding.map((tenant) => {
      const usages = usageInBuilding.filter(
        (u) => String(u.tenant_id) === String(tenant.tenant_id) // Compare tenant_id as strings
      );
      const utilityRecords = {};
      
      // Group usage records by utility type, keeping only the latest bill for each type
      usages.forEach((u) => {
        const key = u.utility_type;
        // Keep the latest bill for each utility type based on bill_date
        if (!utilityRecords[key] || 
            dayjs(u.bill_date).isAfter(dayjs(utilityRecords[key].bill_date))) {
          utilityRecords[key] = u;
        }
      });


      const room = roomsInBuilding.find((r) => 
        Number(r.id) === Number(tenant.room) // Assuming room IDs are consistently numbers
      );

      return {
        ...tenant,
        room: room || {}, // Includes eeuReader and water_reader from backend
        utility_usage: utilityRecords, // This now holds the LATEST usage for each utility type
      };
    });

    setPayments(mergedData);
    setFilteredPayments(mergedData);
     console.log("Merged Payments Data Updated:", mergedData);
  }, [allTenants, allUsage, allRooms, allStalls, buildingId]);


  // This effect updates the utility meter reading modal form when a tenant is selected
  // It should use the LATEST readings from utility_usage or room defaults if no usage exists
  useEffect(() => {
    if (selectedTenant && selectedTenant.utility_usage) {
      const fields = {};
      utilityTypes.forEach(({ key, paymentField }) => {
        // Check if the tenant pays for this utility
        if (selectedTenant[paymentField]) {
          const latestUsage = selectedTenant.utility_usage?.[key];
          if (latestUsage) {
             // If there is a latest usage record, use its current reading as the previous reading
            fields[`${key}_previous`] = Number(latestUsage.current_reading);
          } else {
            // If no usage record exists, use the initial room reader value as the previous reading
            let initialValue = 0;
            if (key === "electricity") {
              // Handle potential "0" string and null/undefined for eeuReader
              const raw = selectedTenant.room?.eeuReader;
              initialValue = (raw !== undefined && raw !== null && raw !== "") ? Number(raw) : 0;
              // Optional: If backend sends "0" for new readers and you want a starting value like 1000
              // initialValue = initialValue === 0 ? 1000 : initialValue;
            } else if (key === "water") {
              const raw = selectedTenant.room?.water_reader;
              initialValue = (raw !== undefined && raw !== null && raw !== "") ? Number(raw) : 0;
            }
            fields[`${key}_previous`] = initialValue;
          }
        }
      });
      form.setFieldsValue(fields);
    } else if (selectedTenant && selectedTenant.room) {
       // If selectedTenant exists but has no utility_usage yet, use room defaults
        const fields = {};
        utilityTypes.forEach(({ key, paymentField }) => {
            if(selectedTenant[paymentField]) {
                let initialValue = 0;
                if (key === "electricity") {
                    const raw = selectedTenant.room?.eeuReader;
                    initialValue = (raw !== undefined && raw !== null && raw !== "") ? Number(raw) : 0;
                    // initialValue = initialValue === 0 ? 1000 : initialValue; // Optional: starting value
                } else if (key === "water") {
                     const raw = selectedTenant.room?.water_reader;
                    initialValue = (raw !== undefined && raw !== null && raw !== "") ? Number(raw) : 0;
                }
                fields[`${key}_previous`] = initialValue;
            }
        });
         form.setFieldsValue(fields);
    }
  }, [selectedTenant, form]);

  const handleMarkAsPaid = async (tenantId) => {
    try {
      // Pass the tenantId as is (number or string) to the backend
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
       // Note: Searching by utility payment date is complex due to multiple utilities.
       // This search only filters by Rent paymentDuty date if available.
      if (filters.paymentDate && payment.rent_start_date && payment.payment_term) {
        const searchDate = dayjs(filters.paymentDate).startOf('day');
         // Recalculate rent payment duty for filtering
        let lastDutyDate = dayjs(payment.rent_start_date);
        const now = dayjs();
        // Find the duty date that is on or before the search date, but not before the lease start
        while (lastDutyDate.add(payment.payment_term, 'day').isBefore(searchDate, 'day') || lastDutyDate.add(payment.payment_term, 'day').isSame(searchDate, 'day')) {
           const nextDate = lastDutyDate.add(payment.payment_term, 'day');
           if (nextDate.isAfter(dayjs(payment.rent_start_date))) { // Ensure we don't go before the start date
              lastDutyDate = nextDate;
           } else {
               break; // Stop if adding term doesn't move past the start date
           }
        }
         // The duty date to check against is the one calculated above
        const rentDutyDateForSearch = lastDutyDate;

         // Check if the search date falls on or after the calculated rent duty date
        matches = matches && searchDate.isSame(rentDutyDateForSearch, "day");

         // If you wanted to search by *any* utility bill date, this logic would need to iterate
         // through `payment.utility_usage` and check `bill_date` or `due_date`.
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
  console.log("🧾 Opening Utility Modal for:", tenant.full_name);
  console.log("🏠 Room data:", tenant.room);

  setSelectedTenant(tenant);
  form.resetFields(); // Reset form fields on modal open

  const fields = {};
  utilityTypes.forEach(({ key, paymentField }) => {
    // Only set initial values for utilities the tenant is responsible for
    if (tenant[paymentField]) {
      const latestUsage = tenant.utility_usage?.[key];

      if (latestUsage) {
        // If there's a latest usage record, use its current reading as the previous reading
        fields[`${key}_previous`] = Number(latestUsage.current_reading);
      } else {
        // If no usage record, use the room's initial reader value as the previous reading
        let initial = 0;
        if (key === "electricity") {
          const raw = tenant.room?.eeuReader;
          initial = (raw !== undefined && raw !== null && raw !== "") ? Number(raw) : 0;
          // Optional: If backend sends "0" for new readers and you want a starting value like 1000
          // initialValue = initialValue === 0 ? 1000 : initialValue;
        } else if (key === "water") {
          const raw = tenant.room?.water_reader;
          initial = (raw !== undefined && raw !== null && raw !== "") ? Number(raw) : 0;
        }
        fields[`${key}_previous`] = initial;
      }
    }
  });

  console.log("📝 Final fields set to form:", fields);

  form.setFieldsValue(fields); // Set form values once
  setIsUtilityModalVisible(true);
};


  // Handle Utility Bill Submission (MODIFIED: Added building_id to payload)
const handleUtilitySubmit = async () => {
  try {
    const values = await form.validateFields();
    if (!selectedTenant) throw new Error("No tenant selected");
    const payloads = [];
    utilityTypes.forEach(({ key, paymentField, label }) => {
      if (selectedTenant[paymentField]) {
        const currentVal = values[`${key}_current`];
        const previousVal = values[`${key}_previous`]; // Get previous reading from form
        if (currentVal === undefined || previousVal === undefined) {
           throw new Error(`Missing reading for ${label}`);
        }

        payloads.push({
          tenant_id: selectedTenant.tenant_id, // Send tenant_id as is (number or string)
          building_id: buildingId, // Include building_id
          utility_type: key,
          previous_reading: previousVal, // Include previous reading
          current_reading: currentVal,
        });
      }
    });

    if (payloads.length === 0) {
        message.info("No utility readings to submit for this tenant.");
        setIsUtilityModalVisible(false);
        return;
    }

    setIsSubmitting(true); // Start submission loading state
    await Promise.all(
      payloads.map((payload) =>
        axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/utilities/usage`, payload)
      )
    );
    message.success("Utility records created!");
    form.resetFields(); // Clear form fields
    fetchAllData(); // Refetch data to update the table
    setIsUtilityModalVisible(false);
  } catch (error) {
    console.error("Submission error:", error);
    message.error("Failed to submit utility readings: " + (error.response?.data?.message || error.message));
  } finally {
     setIsSubmitting(false); // End submission loading state
  }
};

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
      utilityTypes.forEach(({ key, label, paymentField }) => {
        if (selectedTenant && selectedTenant[paymentField]) {
          // Find the latest usage record for this utility type for the selected tenant
          const latestUsage = selectedTenant.utility_usage?.[key];
          if (
             latestUsage &&
            (latestUsage.utility_status === "Bill Generated" || latestUsage.utility_status === "Overdue") && // Allow submitting proof for overdue bills
            values[`${key}_payment_proof_link`]
          ) {
            submissionPromises.push(
              axios.post(`${API_BASE}/api/utilities/confirm`, {
                usage_id: latestUsage.id, // Use the ID of the latest usage record
                payment_proof_link: values[`${key}_payment_proof_link`],
                // Include tenant_id and building_id for backend verification if needed
                 tenant_id: selectedTenant.tenant_id, // Send tenant_id as is
                 building_id: buildingId,
              })
            );
          }
        }
      });
      if (submissionPromises.length > 0) {
        await Promise.all(submissionPromises);
        message.success("Payment proofs submitted successfully. Await admin review.");
        proofForm.resetFields(); // Clear proof form fields
        fetchAllData(); // Refetch all data to update the table
      } else {
          message.info("No pending bills to submit proof for this tenant.");
      }

      setIsProofModalVisible(false);
    } catch (error) {
      console.error("Error submitting payment proof:", error);
      message.error("Failed to submit payment proofs: " + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------
  // View Bill / Approve Payment Proof Modal (Admin Side)
  // Note: This endpoint likely needs usage_id, which links to the bill/tenant/building.
  // If backend needs buildingId explicitly, modify this call.
  // ---------------------------
  const showBillModal = (tenant) => { // This modal is used for both Viewing and Approving
    setSelectedTenant(tenant);
    setIsBillModalVisible(true);
  };

    const handleApproveProof = async () => {
      setIsSubmitting(true); // Start submission loading state
      try {
        if (!selectedTenant) throw new Error("No tenant selected");
        if (!buildingId) throw new Error("Building ID not available."); // Ensure buildingId is available

        const approvalPromises = [];
        if (selectedTenant.utility_usage) {
           // Iterate through the latest usage records for the tenant
          Object.values(selectedTenant.utility_usage).forEach((usage) => {
            if (usage.utility_status === "Submitted") {
              approvalPromises.push(
                axios.post(`${API_BASE}/api/utilities/approve`, {
                  usage_id: usage.id,
                  building_id: buildingId, // ADDED building_id to approve payload
                   tenant_id: selectedTenant.tenant_id, // Send tenant_id as is
                })
              );
            }
          });
        }
        if (approvalPromises.length > 0) {
          await Promise.all(approvalPromises);
          message.success("Payment proofs approved successfully!");
          // Fetch data again after approval
          await fetchAllData();
           console.log("Data fetched after approval. Checking updated payments state for selected tenant:",
             payments.find(p => String(p.tenant_id) === String(selectedTenant.tenant_id))
           );

        } else {
          message.info("No submitted proofs available for approval for this tenant.");
        }
        setIsBillModalVisible(false);
      } catch (error) {
        console.error("Error approving proof:", error);
        message.error("Failed to approve payment proof(s): " + (error.response?.data?.message || error.response?.data?.error || error.message)); // Added error message display
      } finally {
         setIsSubmitting(false); // End submission loading state
      }
    };

  // ---------------------------
  // Render functions for table columns.
  // ---------------------------
  const renderUtilitySection = (record) => {
    // Check if the tenant is configured to pay for any utility
    const paysForAnyUtility = utilityTypes.some(ut => record[ut.paymentField]);

    if (!paysForAnyUtility) {
        console.log(`[${record.full_name}] Tenant does not pay for any utilities. Displaying N/A.`);
        return <Tag color="default">N/A</Tag>;
    }

    let shouldGenerateBill = false;
    let hasAnyBill = false; // Flag to check if ANY utility bill exists

    // Check each utility the tenant pays for to see if a new bill is needed
    for (const { key, paymentField } of utilityTypes) {
        if (record[paymentField]) { // Check if tenant pays for this utility
            const usage = record.utility_usage?.[key];
            console.log(`[${record.full_name}] Checking ${key}. Latest usage:`, usage);

            // If a usage record exists for this utility, set hasAnyBill to true
            if (usage) {
                 hasAnyBill = true;
            }

            // --- Condition to generate a new bill for THIS utility ---
            if (!usage) {
                // Case 1: No usage record exists for this utility
                console.log(`[${record.full_name}] ${key}: No usage record found. Needs new bill.`);
                shouldGenerateBill = true;
                continue;
            }

            // Case 2: Existing usage record handling
            if (usage.utility_status === "Approved") {
                const dueDate = dayjs(usage.due_date);
                const today = dayjs().startOf('day');
                const daysUntilDue = dueDate.diff(today, 'day');

                console.log(`[${record.full_name}] ${key}: Status 'Approved'. Due Date: ${dueDate.format('YYYY-MM-DD')}, Days Until Due: ${daysUntilDue}.`);

                // Only trigger bill generation if due date has PASSED (negative days)
                if (daysUntilDue < 0) {
                    console.log(`[${record.full_name}] ${key}: Approved bill is OVERDUE. Needs new bill.`);
                    shouldGenerateBill = true;
                } else {
                    console.log(`[${record.full_name}] ${key}: Approved bill not yet due. No action needed.`);
                }
            } else if (["Bill Generated", "Submitted", "Overdue"].includes(usage.utility_status)) {
                // Case 3: Existing pending bill cycle
                console.log(`[${record.full_name}] ${key}: Status '${usage.utility_status}'. Current bill cycle active.`);
                hasAnyBill = true;
            }
        } else {
            console.log(`[${record.full_name}] ${key}: Tenant does not pay for this utility.`);
        }
    }

    // --- Render logic ---
    console.log(`[${record.full_name}] Final check: shouldGenerateBill=${shouldGenerateBill}, hasAnyBill=${hasAnyBill}.`);

    if (shouldGenerateBill) {
        console.log(`[${record.full_name}] Displaying 'Generate Bill'.`);
        return (
            <Button icon={<CheckCircleOutlined />} onClick={() => showUtilityModal(record)}>
            Generate Bill
            </Button>
        );
    }
    
    if (hasAnyBill) {
        console.log(`[${record.full_name}] Displaying 'View Bill'.`);
        return (
            <Button type="link" onClick={() => showBillModal(record)}>
            View Bill
            </Button>
        );
    }

    // If no bills exist but tenant pays for utilities
    console.log(`[${record.full_name}] Displaying 'No Bills Yet'.`);
    return <Tag color="default">No Bills Yet</Tag>;
};
  // The Due Info column now shows info for each utility if applicable.
  const renderDueInfoCombined = (record) => {
    const paysForAnyUtility = utilityTypes.some(ut => record[ut.paymentField]);
     if (!paysForAnyUtility && record.rent_start_date) {
        // If tenant only pays rent, show rent payment duty
         let lastDutyDate = dayjs(record.rent_start_date);
          const now = dayjs();
          while (lastDutyDate.add(record.payment_term, 'day').isBefore(now, 'day') || lastDutyDate.add(record.payment_term, 'day').isSame(now, 'day')) {
              lastDutyDate = lastDutyDate.add(record.payment_term, 'day');
          }
          const nextDutyDate = lastDutyDate.add(record.payment_term, 'day');

          return nextDutyDate.isValid()
            ? `Rent: Due ${nextDutyDate.format("YYYY-MM-DD")}`
            : "Rent: -";

     }


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
       if (paysForAnyUtility) {
            return utilityTypes
                .filter(({ key, paymentField }) => record[paymentField])
                .map(({label}) => `${label}: No Bill`).join(" | ");
       }
       // If doesn't pay for utilities and no rent start date, show N/A
       if (!record.rent_start_date) return "-";

       // If only pays rent and rent start date exists, handled at the beginning
        return "-"; // Should not be reached if logic is correct
    }
  };

  const renderPenaltyCombined = (record) => {
    const paysForAnyUtility = utilityTypes.some(ut => record[ut.paymentField]);
     if (!paysForAnyUtility || !record.utility_usage || Object.keys(record.utility_usage).length === 0) {
        return "-";
     }

    return utilityTypes
       .filter(({ key, paymentField }) => record[paymentField]) // Corrected filter condition
       .map(({ key, label }) => { // Removed paymentField from destructuring as it's not used here
        const usage = record.utility_usage[key];
          if(!usage) return `${label}: -`;
        return `${label}: birr${Number(usage.penalty || 0).toFixed(2)}`;
       })
      .join(" | ");
  };

  const renderUtilityStatusCombined = (record) => {
    const paysForAnyUtility = utilityTypes.some(ut => record[ut.paymentField]);
     if (!paysForAnyUtility) return "-";


    if (record.utility_usage && Object.keys(record.utility_usage).length > 0) {
      return utilityTypes
         .filter(({ key, paymentField }) => record[paymentField]) // Corrected filter condition
         .map(({ key, label }) => { // Removed paymentField from destructuring as it's not used here
          const usage = record.utility_usage[key];
            if(!usage) return `${label}: No Bill`;
          return `${label}: ${usage.utility_status}`;
         })
        .join(" | ");
    } else {
       if (paysForAnyUtility) {
            return utilityTypes
                .filter(({ key, paymentField }) => record[paymentField]) // Ensure this filter is correct
                .map(({label}) => `${label}: No Bill`).join(" | ");
       }
       return "-"; // No utilities configured or no bills/usage yet
    }
  };

  const renderActionsCombined = (record) => {
    const actions = [];

    // Action for regular Rent Payment (if status is 'Unpaid') - Assuming 'status' field indicates rent status
    if (record.status === "Unpaid") {
      actions.push(
        <Button key="pay" type="link" onClick={() => handleMarkAsPaid(record.id)}>
          Mark Rent Paid
        </Button>
      );
    }

    // Actions for Utility Payments (Proof Upload/View & Approve)
    const needsProofUpload = record.utility_usage && Object.values(record.utility_usage).some(usage =>
        (usage.utility_status === "Bill Generated" || usage.utility_status === "Overdue")
         && utilityTypes.some(ut => ut.key === usage.utility_type && record[ut.paymentField]) // Ensure tenant pays for this utility
    );

     const needsApproval = record.utility_usage && Object.values(record.utility_usage).some(usage =>
         usage.utility_status === "Submitted"
         && utilityTypes.some(ut => ut.key === usage.utility_type && record[ut.paymentField]) // Ensure tenant pays for this utility
    );

    if (needsProofUpload) {
      actions.push(
        <Button key="upload" type="link" onClick={() => showProofModal(record)}>
          Upload Utility Proof
        </Button>
      );
    }
    if (needsApproval) {
      actions.push(
        <Button key="view-approve" type="link" onClick={() => showBillModal(record)}>
          View & Approve Utility Proof
        </Button>
      );
    }


    return <Space size="middle">{actions}</Space>;
  };


  const columns = [
    { title: "Tenant Name", dataIndex: "full_name", key: "full_name", align: "center" },
    {
      title: "Room",
      dataIndex: "room",
      key: "room",
      render: (room) => room.roomName || "-",
      align: "center"
    },

    { title: "Rent Payment Term", dataIndex: "payment_term", key: "payment_term", align: "center" },
    {
      title: "Rent Payment Duty",
      key: "rentPaymentDuty", // Renamed key to avoid confusion with utility due dates
      render: (_, record) => {
        // This calculates the next *rent* payment duty based on lease start and payment term
        if (record.rent_start_date && record.payment_term) {
          // Find the most recent payment duty date that is in the past or today
          let lastDutyDate = dayjs(record.rent_start_date);
          const now = dayjs();
          // Iterate to find the next duty date *after* the current date
           while (lastDutyDate.isBefore(now, 'day') || lastDutyDate.isSame(now, 'day')) {
               const nextDate = lastDutyDate.add(record.payment_term, 'day');
               if (nextDate.isAfter(lastDutyDate)) { // Prevent infinite loop if term is 0 or invalid
                    lastDutyDate = nextDate;
               } else {
                   // If adding term doesn't move the date forward, it's an invalid term, or already on next date
                   break;
               }
           }

          return lastDutyDate.isValid()
            ? lastDutyDate.format("YYYY-MM-DD")
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
             const hasAnyUtilityProof = record.utility_usage && Object.values(record.utility_usage).some(u => u.payment_proof_link && utilityTypes.some(ut => ut.key === u.utility_type && record[ut.paymentField])); // Check if tenant pays for this utility's proof
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
          placeholder="Search by Rent Payment Duty" // Clarified placeholder
          onChange={(date) => handleSearch({ paymentDate: date })}
        />
      </Space>
      <Table
        columns={columns}
        dataSource={filteredPayments} // Use filteredPayments for the table data source
        rowKey="id" // Assuming 'id' is the unique key for the tenant record
        loading={loading || isSubmitting} // Indicate loading during submissions as well
        pagination={{ pageSize: 10 }} // Add pagination
      />

      {/* Utility Meter Reading Modal */}
      <Modal
        title={`Enter Utility Meter Readings for ${selectedTenant?.full_name || ''}`}
        visible={isUtilityModalVisible}
        onCancel={() => {setIsUtilityModalVisible(false); form.resetFields();}} // Reset form on cancel
        onOk={handleUtilitySubmit}
        confirmLoading={isSubmitting} // Show loading state for utility submission
      >
        <Form form={form} layout="vertical">
          {selectedTenant && utilityTypes.map(({ key, label, paymentField }) => {
            // Only show fields for utilities this tenant is responsible for
            if (selectedTenant[paymentField]) {
              // Get the previous reading from the form's initial values
              const previousReading = form.getFieldValue(`${key}_previous`) || 0;

              return (
                <React.Fragment key={key}>
                 <Form.Item
                  label={`${label} Previous Reading`}
                  name={`${key}_previous`}
                  // initialValue is set in the useEffect when selectedTenant changes
                >
                  <InputNumber
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
           {selectedTenant && !utilityTypes.some(({ paymentField }) => selectedTenant[paymentField]) && (
             <p>This tenant is not configured to pay for any utilities.</p>
           )}
        </Form>
      </Modal>

      {/* Payment Proof Upload Modal */}
      <Modal
        title={`Upload Payment Proof for ${selectedTenant?.full_name || ''}`}
        visible={isProofModalVisible}
        onCancel={() => {setIsProofModalVisible(false); proofForm.resetFields();}} // Reset form on cancel
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
      {/* ... previous parts of the modal ... */}

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
            // Check if ANY utility usage record for this tenant is in 'Submitted' status
            Object.values(selectedTenant.utility_usage).some(
              (usage) => usage && usage.utility_status === "Submitted"
            ) && (
                // You might want to approve individual proofs rather than a single button for all.
                // If approving all submitted proofs at once, the backend needs to handle it.
                // A safer approach is often an 'Approve' button per submitted proof item.
                // If this button is meant to approve *all* submitted proofs for this tenant,
                // your `handleApproveProof` function needs to find all submitted proofs
                // for this tenant and call the backend's approve endpoint for each, or
                // a new backend endpoint that approves by tenant ID.
                // The current backend `approveUtilityPayment` takes a single `usage_id`.
                // Let's assume for now this button triggers a process to approve *all* submitted proofs for the tenant.
              <Button
                key="approve-all-submitted" // Changed key for clarity
                type="primary"
                onClick={() => handleApproveProof(selectedTenant.tenant_id)} // Pass tenant_id or trigger loop
                loading={isSubmitting} // Assuming isSubmitting state is managed for this process
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }} // Ant Design primary green
              >
                Approve Submitted Payments
              </Button>
            ),
        ]}
        width={700} // Increased width for better display of multiple utility details
        bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }}
      >
        {selectedTenant ? ( // Simplified check
          <div>
            {utilityTypes.map(({ key, label }) => {
              // Get the latest usage record for this utility type
              const usage = selectedTenant.utility_usage?.[key];

              // Construct the full URL for the payment proof file
              // Combine the base API URL with the stored file path
              const proofUrl = usage?.payment_proof_link
                ? `${import.meta.env.VITE_API_BASE_URL}/${usage.payment_proof_link}`
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
                    <strong>Cost:</strong> birr{usage.cost || "N/A"}&nbsp;&nbsp;
                    <strong>Penalty:</strong> birr{Number(usage.penalty || 0).toFixed(2)} {/* Use 'birr' consistently */}
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

                  {/* Display Payment Proof using the constructed URL */}
                  {proofUrl ? (
                    <div>
                      <p>
                        <strong>{label} Payment Proof:</strong>
                      </p>
                        {/* Check the file extension */}
                        {proofUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                           <a href={proofUrl} target="_blank" rel="noopener noreferrer">
                             <img
                               src={proofUrl} // Use the constructed URL
                               alt={`${label} Payment Proof`}
                               style={{ maxWidth: "100%", height: "auto" }}
                              />
                                View Image Proof
                           </a>
                        ) : proofUrl.match(/\.(pdf)$/i) ? (
                           <a href={proofUrl} target="_blank" rel="noopener noreferrer">View PDF Proof</a>
                        ) : (
                           // Fallback for any other file type or just the raw link
                           <a href={proofUrl} target="_blank" rel="noopener noreferrer">View Proof File</a>
                        )}

                        {/* Optional: Add an "Approve" button next to the proof for admin to action */}
                        {usage.utility_status === 'Submitted' && (
                            <Button
                                size="small" // Adjust size as needed
                                type="primary"
                                onClick={() => handleApproveSingleProof(usage.id)} // Needs a function to approve a single usage ID
                                loading={isSubmitting === usage.id} // Track loading per item
                                style={{ marginLeft: '10px', backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                            >
                                Approve
                            </Button>
                        )}

                    </div>
                  ) : (
                    <p>No Payment Proof Submitted for {label}.</p>
                  )}
                </div>
              ) : null;
            })}
             {/* Handle case where there are no utility bills */}
             {selectedTenant && (!selectedTenant.utility_usage || Object.keys(selectedTenant.utility_usage).length === 0) && (
                 <p>This tenant does not have any generated utility bills yet.</p>
             )}
          </div>
        ) : (
            <p>Select a tenant to view utility bills.</p> // Message when no tenant is selected
        )} {/* End of selectedTenant check */}
      </Modal>
    </div>
  );
};

export default Payments;