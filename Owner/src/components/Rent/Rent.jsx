// import React, { useState, useEffect } from "react";
// import moment from "moment";
// import {
//   Table,
//   Tag,
//   Space,
//   Button,
//   Modal,
//   message,
//   Form,
//   Input,
// } from "antd";
// import {
//   FileDoneOutlined,
//   CheckCircleOutlined,
//   PlusCircleOutlined,
//   UploadOutlined,
// } from "@ant-design/icons";
// import axios from "axios";
// import { Link } from "react-router-dom";

// // Use environment variable if defined or default to localhost.
// const API_BASE = "http://localhost:5000/api";

// const Rent = () => {
//   const [data, setData] = useState([]);
//   const [modalImage, setModalImage] = useState(null);
//   const [selectedRecord, setSelectedRecord] = useState(null);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [proofModalVisible, setProofModalVisible] = useState(false);
//   const [proofLink, setProofLink] = useState("");

//   // ------------------------------------------------------------------
//   // Fetch tenants and bills concurrently, then merge the data.
//   // If a tenant has no corresponding bill record, default values are set.
//   // For a 60‑day term, we set the base rent amount to 1000.
//   // The merged data now includes bill_date (if available),
//   // which is later used to calculate the cycle's start for countdown.
//   // ------------------------------------------------------------------
//   const fetchData = async () => {
//     try {
//       const [tenantRes, billRes] = await Promise.all([
//         fetch(`${API_BASE}/tenants`).then((res) => res.json()),
//         fetch(`${API_BASE}/rent`).then((res) => res.json()),
//       ]);

//       const mergedData = tenantRes.map((tenant) => {
//         const termDays = Number(tenant.payment_term) || 30;
//         const baseAmount =
//           termDays === 60 ? 1000 : parseFloat(tenant.monthlyRent) || 0;

//         // Look for an existing bill for the tenant.
//         const bill = billRes.find(
//           (b) => Number(b.tenant_id) === Number(tenant.id)
//         );

//         if (bill) {
//           return {
//             key: tenant.id.toString(),
//             billId: bill.id, // ID of the generated bill
//             name: tenant.full_name,
//             room: tenant.room,
//             term: `${termDays} days`,
//             dueDate: bill.due_date || tenant.rent_end_date.split("T")[0],
//             billDate: bill.bill_date || null, // Capture the cycle start if available
//             rentAmount: baseAmount,
//             penalty: parseFloat(bill.penalty) || 0,
//             totalDue:
//               parseFloat(bill.amount) + (parseFloat(bill.penalty) || 0),
//             status: bill.payment_status, // e.g., "pending", "submitted", "approved", "paid"
//             proof: bill.payment_proof_url || "",
//             approved:
//               bill.payment_status &&
//               (bill.payment_status.toLowerCase() === "approved" ||
//                 bill.payment_status.toLowerCase() === "paid"),
//             billGenerated: true,
//           };
//         } else {
//           return {
//             key: tenant.id.toString(),
//             billId: null,
//             name: tenant.full_name,
//             room: tenant.room,
//             term: `${termDays} days`,
//             dueDate: tenant.rent_end_date.split("T")[0],
//             billDate: null,
//             rentAmount: baseAmount,
//             penalty: 0,
//             totalDue: baseAmount,
//             status: "Pending",
//             proof: "",
//             approved: false,
//             billGenerated: false,
//           };
//         }
//       });

//       setData(mergedData);
//     } catch (error) {
//       console.error("Error fetching merged data:", error);
//       message.error("Failed to fetch tenant and bill data.");
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   // ------------------------------------------------------------------
//   // Auto-update overdue bills every minute.
//   // This endpoint should update penalties for bills overdue by more than 60 days.
//   // ------------------------------------------------------------------
//   useEffect(() => {
//     const updateOverdueBills = async () => {
//       try {
//         await axios.patch(`${API_BASE}/rent/updateOverdue`);
//         fetchData();
//       } catch (error) {
//         console.error("Error updating overdue bills:", error);
//       }
//     };

//     const intervalId = setInterval(updateOverdueBills, 60 * 1000);
//     return () => clearInterval(intervalId);
//   }, []);

//   // ------------------------------------------------------------------
//   // Optional Auto-Renew Effect:
//   // Every minute, for approved/paid records, if fewer than 10 days remain in
//   // the current billing cycle (based on the cycle start/date), we automatically
//   // trigger the generate bill flow.
//   // If you want manual renewal via the button only, you can disable this effect.
//   // ------------------------------------------------------------------
//   useEffect(() => {
//     const autoRenew = async () => {
//       data.forEach((record) => {
//         const lowerStatus = record.status.toLowerCase();
//         if (lowerStatus === "paid" || lowerStatus === "approved") {
//           const termDays = parseInt(record.term);
//           // Use billDate if available; otherwise, fallback to dueDate.
//           const cycleStart = record.billDate
//             ? moment(record.billDate)
//             : moment(record.dueDate);
//           const nextDueDate = cycleStart.clone().add(termDays, "days");
//           const daysLeft = nextDueDate.diff(moment(), "days");
//           if (daysLeft <= 10 && record.billGenerated) {
//             console.log("Auto-renew triggered for tenant:", record.name);
//             generateBill(record);
//           }
//         }
//       });
//     };

//     const autoRenewInterval = setInterval(autoRenew, 60 * 1000);
//     return () => clearInterval(autoRenewInterval);
//   }, [data]);

//   // ------------------------------------------------------------------
//   // Generate a new bill.
//   // This function unifies the flow for both new bills and renewals.
//   // For approved/paid records, if fewer than 10 days remain (based on billDate or dueDate plus term),
//   // it computes a new due date (today + term days) and calls the backend.
//   // ------------------------------------------------------------------
//   const generateBill = async (record) => {
//     let payload;
//     const lowerStatus = record.status.toLowerCase();
//     const termDays = parseInt(record.term);

//     // For approved/paid bills, use the cycle start (billDate if available) to compute the next due date.
//     if (lowerStatus === "paid" || lowerStatus === "approved") {
//       const cycleStart = record.billDate
//         ? moment(record.billDate)
//         : moment(record.dueDate);
//       const nextDueDate = cycleStart.clone().add(termDays, "days");
//       const daysLeft = nextDueDate.diff(moment(), "days");

//       // Only trigger renewal (new due date) when fewer than or equal to 10 days remain.
//       if (daysLeft <= 10) {
//         const newDueDate = moment().add(termDays, "days").format("YYYY-MM-DD");
//         payload = {
//           tenant_id: record.key,
//           bill_date: new Date().toISOString().slice(0, 10),
//           due_date: newDueDate,
//           amount: record.rentAmount,
//         };
//       } else {
//         // If still a long way off, generate using the existing dueDate—this branch is rarely used.
//         let penalty = 0;
//         if (daysLeft < 0 && Math.abs(daysLeft) > 60) {
//           penalty = record.rentAmount * 0.01 * (Math.abs(daysLeft) - 60);
//         }
//         payload = {
//           tenant_id: record.key,
//           bill_date: new Date().toISOString().slice(0, 10),
//           due_date: record.dueDate,
//           amount: record.rentAmount,
//         };
//       }
//     } else {
//       // For unpaid bills, use existing dueDate and compute penalty if overdue.
//       const daysLeft = moment(record.dueDate).diff(moment(), "days");
//       let penalty = 0;
//       if (daysLeft < 0 && Math.abs(daysLeft) > 60) {
//         penalty = record.rentAmount * 0.01 * (Math.abs(daysLeft) - 60);
//       }
//       payload = {
//         tenant_id: record.key,
//         bill_date: new Date().toISOString().slice(0, 10),
//         due_date: record.dueDate,
//         amount: record.rentAmount,
//       };
//     }

//     try {
//       const response = await axios.post(`${API_BASE}/rent/generate`, payload);
//       const returnedBillId = response.data.billId;
//       const payment_status = response.data.payment_status || "Unpaid";

//       const newData = data.map((item) =>
//         item.key === record.key
//           ? {
//               ...item,
//               billGenerated: true,
//               status:
//                 payment_status.charAt(0).toUpperCase() +
//                 payment_status.slice(1),
//               billId: returnedBillId,
//               // If renewed, update dueDate to the new due_date; otherwise leave intact.
//               dueDate:
//                 (lowerStatus === "paid" || lowerStatus === "approved") &&
//                 moment(
//                   record.billDate ? record.billDate : record.dueDate
//                 )
//                   .add(termDays, "days")
//                   .diff(moment(), "days") <= 10
//                   ? payload.due_date
//                   : item.dueDate,
//               penalty:
//                 (lowerStatus === "paid" || lowerStatus === "approved") &&
//                 moment(
//                   record.billDate ? record.billDate : record.dueDate
//                 )
//                   .add(termDays, "days")
//                   .diff(moment(), "days") <= 10
//                   ? 0
//                   : item.penalty,
//               totalDue:
//                 (lowerStatus === "paid" || lowerStatus === "approved") &&
//                 moment(
//                   record.billDate ? record.billDate : record.dueDate
//                 )
//                   .add(termDays, "days")
//                   .diff(moment(), "days") <= 10
//                   ? record.rentAmount
//                   : item.totalDue,
//             }
//           : item
//       );
//       setData(newData);
//       message.success(
//         `Bill generated! Total Due: ${record.rentAmount.toFixed(2)} Birr`
//       );
//     } catch (error) {
//       console.error("Error generating bill:", error);
//       message.error("Failed to generate bill");
//     }
//   };

//   // ------------------------------------------------------------------
//   // Submit the payment proof (an image URL) for the generated bill.
//   // ------------------------------------------------------------------
//   const submitProof = async () => {
//     if (!proofLink.trim()) {
//       message.error("Please enter a valid image link.");
//       return;
//     }
//     try {
//       if (!selectedRecord.billId) {
//         message.error("Bill not generated. Generate the bill first.");
//         return;
//       }
//       await axios.patch(
//         `${API_BASE}/rent/${selectedRecord.billId}/proof`,
//         { proof_url: proofLink }
//       );
//       const newData = data.map((item) =>
//         item.key === selectedRecord.key ? { ...item, proof: proofLink } : item
//       );
//       setData(newData);
//       setProofModalVisible(false);
//       setProofLink("");
//       message.success("Payment proof submitted!");
//     } catch (error) {
//       console.error("Error submitting payment proof:", error);
//       message.error("Failed to submit payment proof");
//     }
//   };

//   // ------------------------------------------------------------------
//   // Approve payment for a given bill.
//   // ------------------------------------------------------------------
//   const handleApprove = async (record) => {
//     try {
//       if (!record.billId) {
//         message.error("Bill not generated. Cannot approve payment.");
//         return;
//       }
//       await axios.patch(`${API_BASE}/rent/${record.billId}/approve`);
//       const newData = data.map((item) =>
//         item.key === record.key
//           ? { ...item, approved: true, status: "Paid" }
//           : item
//       );
//       setData(newData);
//       message.success("Payment approved!");
//     } catch (error) {
//       console.error("Error approving payment:", error);
//       message.error("Failed to approve payment");
//     }
//   };

//   // ------------------------------------------------------------------
//   // Modal helper functions.
//   // ------------------------------------------------------------------
//   const openProofModal = (record) => {
//     setSelectedRecord(record);
//     setProofModalVisible(true);
//   };

//   const handleViewImage = (record) => {
//     setModalImage(record.proof);
//     setSelectedRecord(record);
//     setModalVisible(true);
//   };

//   // ------------------------------------------------------------------
//   // Table column definitions.
//   // ------------------------------------------------------------------
//  const columns = [
//     { title: "Tenant Name", dataIndex: "name", key: "name" },
//     { title: "Room", dataIndex: "room", key: "room" },
//     { title: "Payment Term", dataIndex: "term", key: "term" },
//     { title: "Due Date", dataIndex: "dueDate", key: "dueDate" },
//     {
//       title: "Rent Amount",
//       dataIndex: "rentAmount",
//       key: "rentAmount",
//       render: (amount) => `${amount.toFixed(2)} Birr`,
//     },
//     {
//       title: "Penalty",
//       dataIndex: "penalty",
//       key: "penalty",
//       render: (penalty) => `${penalty.toFixed(2)} Birr`,
//     },
//     {
//       title: "Total Due",
//       dataIndex: "totalDue",
//       key: "totalDue",
//       render: (total) => `${total.toFixed(2)} Birr`,
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       key: "status",
//       render: (status) => {
//         const lowerStatus = status.toLowerCase();
//         const color =
//           lowerStatus === "paid" || lowerStatus === "approved"
//             ? "green"
//             : lowerStatus === "pending"
//             ? "blue"
//             : "red";
//         return <Tag color={color}>{status.toUpperCase()}</Tag>;
//       },
//     },
//     {
//       title: "Generate Bill",
//       key: "generateBill",
//       render: (_, record) => {
//         const lowerStatus = record.status.toLowerCase();
//         if (lowerStatus === "paid" || lowerStatus === "approved") {
//           const termDays = parseInt(record.term);
//           const cycleStart = record.billDate
//             ? moment(record.billDate)
//             : moment(record.dueDate);
//           const nextDueDate = cycleStart.clone().add(termDays, "days");
//           const daysLeft = nextDueDate.diff(moment(), "days");
//           if (daysLeft > 10) {
//             return <Tag color="blue">{daysLeft} days left</Tag>;
//           } else {
//             return (
//               <Button
//                 type="primary"
//                 icon={<PlusCircleOutlined />}
//                 onClick={() => generateBill(record)}
//               >
//                 Generate Bill
//               </Button>
//             );
//           }
//         } else {
//           const daysLeft = moment(record.dueDate).diff(moment(), "days");
//           if (daysLeft <= 10) {
//             return !record.billGenerated ? (
//               <Button
//                 type="primary"
//                 icon={<PlusCircleOutlined />}
//                 onClick={() => generateBill(record)}
//               >
//                 Generate Bill
//               </Button>
//             ) : (
//               <Tag color="green">Generated</Tag>
//             );
//           } else {
//             return <Tag color="blue">{daysLeft} days left</Tag>;
//           }
//         }
//       },
//     },
//     {
//       title: "Payment Proof",
//       key: "proof",
//       render: (_, record) => (
//         <Space>
//           {!record.proof ? (
//             <Button
//               type="dashed"
//               icon={<UploadOutlined />}
//               onClick={() => openProofModal(record)}
//             >
//               Submit Proof
//             </Button>
//           ) : (
//             <Button
//               type="link"
//               icon={<FileDoneOutlined />}
//               onClick={() => handleViewImage(record)}
//             >
//               View Proof
//             </Button>
//           )}
//         </Space>
//       ),
//     },
//     {
//       title: "Details",
//       key: "details",
//       render: (_, record) =>
//         record.billId ? (
//           <Link to={`/rent-info/${record.billId}`}>View Details</Link>
//         ) : (
//           "Not Generated"
//         ),
//     },
//     {
//       title: "Approve Payment",
//       key: "approve",
//       render: (_, record) =>
//         record.proof &&
//         !(record.status.toLowerCase() === "paid" ||
//           record.status.toLowerCase() === "approved") ? (
//           <Button
//             type="primary"
//             icon={<CheckCircleOutlined />}
//             onClick={() => handleApprove(record)}
//           >
//             Approve
//           </Button>
//         ) : (
//           <Tag color={record.approved ? "green" : "red"}>
//             {record.approved ? "Approved" : "Pending"}
//           </Tag>
//         ),
//     },
//   ];

//   // ------------------------------------------------------------------
//   // Component render.
//   // ------------------------------------------------------------------
//   return (
//     <div style={{ padding: "20px" }}>
//       <Table
//         columns={columns}
//         dataSource={data}
//         bordered
//         title={() => <h2>Rent Management</h2>}
//         pagination={{ pageSize: 5 }}
//         size="middle"
//       />

//       {/* Modal for Viewing Payment Proof */}
//       <Modal
//         visible={modalVisible}
//         footer={[
//           <Button key="cancel" onClick={() => setModalVisible(false)}>
//             Close
//           </Button>,
//           selectedRecord &&
//             !selectedRecord.approved && (
//               <Button
//                 key="approve"
//                 type="primary"
//                 icon={<CheckCircleOutlined />}
//                 onClick={() => handleApprove(selectedRecord)}
//               >
//                 Approve Payment
//               </Button>
//             ),
//         ]}
//         onCancel={() => setModalVisible(false)}
//       >
//         <img src={modalImage} alt="Proof" style={{ width: "100%" }} />
//       </Modal>

//       {/* Modal for Submitting Payment Proof */}
//       <Modal
//         visible={proofModalVisible}
//         title="Submit Payment Proof"
//         onCancel={() => setProofModalVisible(false)}
//         footer={[
//           <Button key="cancel" onClick={() => setProofModalVisible(false)}>
//             Cancel
//           </Button>,
//           <Button
//             key="submit"
//             type="primary"
//             icon={<UploadOutlined />}
//             onClick={submitProof}
//           >
//             Submit
//           </Button>,
//         ]}
//       >
//         <Form>
//           <Form.Item label="Image Link" required>
//             <Input
//               placeholder="Enter proof image link"
//               value={proofLink}
//               onChange={(e) => setProofLink(e.target.value)}
//             />
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// };

// export default Rent;
import React, { useState, useEffect } from "react";
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
const API_BASE ="http://localhost:5000/api";

const Rent = () => {
  const [data, setData] = useState([]);
  const [modalImage, setModalImage] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [proofLink, setProofLink] = useState("");
  // New state for details modal (showing RentInfo)
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsRecord, setDetailsRecord] = useState(null);

  // ------------------------------------------------------------------
  // Fetch tenants and bills concurrently, then merge the data.
  // ------------------------------------------------------------------
  const fetchData = async () => {
    try {
      const [tenantRes, billRes] = await Promise.all([
        fetch(`${API_BASE}/tenants`).then((res) => res.json()),
        fetch(`${API_BASE}/rent`).then((res) => res.json()),
      ]);

      const mergedData = tenantRes.map((tenant) => {
        const termDays = Number(tenant.payment_term) || 30;
        const baseAmount =
          termDays === 60 ? 1000 : parseFloat(tenant.monthlyRent) || 0;

        // Look for an existing bill for the tenant.
        const bill = billRes.find(
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

    const intervalId = setInterval(updateOverdueBills, 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  // ------------------------------------------------------------------
  // Optional Auto-Renew Effect.
  // ------------------------------------------------------------------
  useEffect(() => {
    const autoRenew = async () => {
      data.forEach((record) => {
        const lowerStatus = record.status.toLowerCase();
        if (lowerStatus === "paid" || lowerStatus === "approved") {
          const termDays = parseInt(record.term);
          const cycleStart = record.billDate
            ? moment(record.billDate)
            : moment(record.dueDate);
          const nextDueDate = cycleStart.clone().add(termDays, "days");
          const daysLeft = nextDueDate.diff(moment(), "days");
          if (daysLeft <= 10 && record.billGenerated) {
            console.log("Auto-renew triggered for tenant:", record.name);
            generateBill(record);
          }
        }
      });
    };

    const autoRenewInterval = setInterval(autoRenew, 60 * 1000);
    return () => clearInterval(autoRenewInterval);
  }, [data]);

  // ------------------------------------------------------------------
  // Generate a new bill.
  // ------------------------------------------------------------------
  const generateBill = async (record) => {
    let payload;
    const lowerStatus = record.status.toLowerCase();
    const termDays = parseInt(record.term);

    if (lowerStatus === "paid" || lowerStatus === "approved") {
      const cycleStart = record.billDate
        ? moment(record.billDate)
        : moment(record.dueDate);
      const nextDueDate = cycleStart.clone().add(termDays, "days");
      const daysLeft = nextDueDate.diff(moment(), "days");

      if (daysLeft <= 10) {
        const newDueDate = moment().add(termDays, "days").format("YYYY-MM-DD");
        payload = {
          tenant_id: record.key,
          bill_date: new Date().toISOString().slice(0, 10),
          due_date: newDueDate,
          amount: record.rentAmount,
        };
      } else {
        let penalty = 0;
        if (daysLeft < 0 && Math.abs(daysLeft) > 60) {
          penalty = record.rentAmount * (0.01 * (Math.abs(daysLeft) - 60));
        }
        payload = {
          tenant_id: record.key,
          bill_date: new Date().toISOString().slice(0, 10),
          due_date: record.dueDate,
          amount: record.rentAmount,
        };
      }
    } else {
      const daysLeft = moment(record.dueDate).diff(moment(), "days");
      let penalty = 0;
      if (daysLeft < 0 && Math.abs(daysLeft) > 60) {
        penalty = record.rentAmount * (0.01 * (Math.abs(daysLeft) - 60));
      }
      payload = {
        tenant_id: record.key,
        bill_date: new Date().toISOString().slice(0, 10),
        due_date: record.dueDate,
        amount: record.rentAmount,
      };
    }

    try {
      const response = await axios.post(`${API_BASE}/rent/generate`, payload);
      const returnedBillId = response.data.billId;
      const payment_status = response.data.payment_status || "Unpaid";

      const newData = data.map((item) =>
        item.key === record.key
          ? {
              ...item,
              billGenerated: true,
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
                  .diff(moment(), "days") <= 10
                  ? payload.due_date
                  : item.dueDate,
              penalty:
                (lowerStatus === "paid" || lowerStatus === "approved") &&
                moment(
                  record.billDate ? record.billDate : record.dueDate
                )
                  .add(termDays, "days")
                  .diff(moment(), "days") <= 10
                  ? 0
                  : item.penalty,
              totalDue:
                (lowerStatus === "paid" || lowerStatus === "approved") &&
                moment(
                  record.billDate ? record.billDate : record.dueDate
                )
                  .add(termDays, "days")
                  .diff(moment(), "days") <= 10
                  ? record.rentAmount
                  : item.totalDue,
            }
          : item
      );
      setData(newData);
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
      const newData = data.map((item) =>
        item.key === selectedRecord.key ? { ...item, proof: proofLink } : item
      );
      setData(newData);
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
  const handleApprove = async (record) => {
    try {
      if (!record.billId) {
        message.error("Bill not generated. Cannot approve payment.");
        return;
      }
      await axios.patch(`${API_BASE}/rent/${record.billId}/approve`);
      const newData = data.map((item) =>
        item.key === record.key
          ? { ...item, approved: true, status: "Paid" }
          : item
      );
      setData(newData);
      message.success("Payment approved!");
    } catch (error) {
      console.error("Error approving payment:", error);
      message.error("Failed to approve payment");
    }
  };

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

  // New helper for opening RentInfo details modal.
  const openDetailsModal = (record) => {
    if (!record.billId) {
      message.error("Bill not generated. Cannot view details.");
      return;
    }
    setDetailsRecord(record);
    setDetailsModalVisible(true);
  };

  // ------------------------------------------------------------------
  // Table column definitions.
  // ------------------------------------------------------------------
  const columns = [
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
        const color =
          lowerStatus === "paid" || lowerStatus === "approved"
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
      render: (_, record) => {
        const lowerStatus = record.status.toLowerCase();
        if (lowerStatus === "paid" || lowerStatus === "approved") {
          const termDays = parseInt(record.term);
          const cycleStart = record.billDate
            ? moment(record.billDate)
            : moment(record.dueDate);
          const nextDueDate = cycleStart.clone().add(termDays, "days");
          const daysLeft = nextDueDate.diff(moment(), "days");
          if (daysLeft > 10) {
            return <Tag color="blue">{daysLeft} days left</Tag>;
          } else {
            return (
              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                onClick={() => generateBill(record)}
              >
                Generate Bill
              </Button>
            );
          }
        } else {
          const daysLeft = moment(record.dueDate).diff(moment(), "days");
          if (daysLeft <= 10) {
            return !record.billGenerated ? (
              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                onClick={() => generateBill(record)}
              >
                Generate Bill
              </Button>
            ) : (
              <Tag color="green">Generated</Tag>
            );
          } else {
            return <Tag color="blue">{daysLeft} days left</Tag>;
          }
        }
      },
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
        record.proof &&
        !(record.status.toLowerCase() === "paid" ||
          record.status.toLowerCase() === "approved") ? (
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
  ];

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

      {/* Modal for RentInfo Details with updated width */}
      <Modal
        visible={detailsModalVisible}
        footer={null}
        onCancel={() => setDetailsModalVisible(false)}
        title="Rent Payment Details"
        width={700}  // Adjusted width for a medium-sized modal.
        bodyStyle={{ maxHeight: '80vh', overflowY: 'auto' }}
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
