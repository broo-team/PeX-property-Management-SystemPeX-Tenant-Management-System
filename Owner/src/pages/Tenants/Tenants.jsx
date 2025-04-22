import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Checkbox, DatePicker, message, Select, Tabs, Space, Col, Row } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // Assuming useAuth provides buildingId
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const paymentTerms = [
  { value: 30, label: "1 month" },
  { value: 60, label: "2 months" },
  { value: 90, label: "3 months" },
  { value: 180, label: "6 months" },
  { value: 365, label: "1 year" },
  { value: 730, label: "2 years" },
  { value: 1095, label: "3 years" },
  { value: 1825, label: "5 years" }
];

const Tenants = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAgentRegistered, setIsAgentRegistered] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("1");
  const [allTenants, setAllTenants] = useState([]); // Store all tenants initially
  const [allTerminatedTenants, setAllTerminatedTenants] = useState([]); // Store all terminated tenants
  const [tenants, setTenants] = useState([]); // Filtered active tenants for display
  const [terminatedTenants, setTerminatedTenants] = useState([]); // Filtered terminated tenants for display
  const [allRooms, setAllRooms] = useState([]); // Store all rooms initially
  const [rooms, setRooms] = useState([]); // Rooms related to the selected stall (or all if no stall selected) - this state is likely redundant with availableRooms now
  const [activeRooms, setActiveRooms] = useState([]); // list of rooms currently occupied by active tenants in the current building
  const [allStalls, setAllStalls] = useState([]); // Store all stalls initially
  const [stalls, setStalls] = useState([]); // Filtered stalls for display (by buildingId)
  const [contractEndDate, setContractEndDate] = useState(null);
  const [rentEndDate, setRentEndDate] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [editingTenantId, setEditingTenantId] = useState(null)
  // ... other state variables and functions ...
  const [monthlyRent, setMonthlyRent] = useState(0);
  const [deposit, setDeposit] = useState(0);
  // const [selectedStall, setSelectedStall] = useState(null); // This state variable is not used
  const [availableRooms, setAvailableRooms] = useState([]); // Available rooms filtered by stall and occupancy
  const [selectedStallId, setSelectedStallId] = useState(null);

  const { account, accountType, authLoading, buildingId} = useAuth();
  const owner = accountType === "owner" ? account : null;

  const handleContractUpdate = () => {
    const contractStartDate = form.getFieldValue("contractStartDate");
    const lease_duration = form.getFieldValue("lease_duration");
    const rentStartDate = form.getFieldValue("rentStartDate");
    const payment_term = form.getFieldValue('payment_term');
    const currentMonthlyRent = form.getFieldValue('monthlyRent'); // Get monthly rent from form

    console.log("contractStartDate:", contractStartDate);
    console.log("lease_duration:", lease_duration);
    console.log("rentStartDate:", rentStartDate);
    console.log("payment_term:", payment_term);
    console.log("currentMonthlyRent:", currentMonthlyRent);


    if (contractStartDate && lease_duration) {
        const endDate = dayjs(contractStartDate).add(Number(lease_duration), "day"); // Cast to Number
        setContractEndDate(endDate.format("YYYY-MM-DD"));
        form.setFieldsValue({ contractEndDate: endDate.format("YYYY-MM-DD") });

        const leaseStart = dayjs(contractStartDate);
        const leaseEnd = dayjs(endDate);
        form.setFieldsValue({
            lease_start: leaseStart,
            lease_end: leaseEnd
        });
        console.log("lease_start and lease_end set in form:", leaseStart.format("YYYY-MM-DD"), leaseEnd.format("YYYY-MM-DD"));
    } else {
        setContractEndDate(null);
        form.setFieldsValue({ lease_start: null, lease_end: null });
    }

    if (rentStartDate && payment_term && currentMonthlyRent !== undefined) { // Check if monthlyRent is available
        const rentEndDateCalculated = dayjs(rentStartDate).add(Number(payment_term), 'day'); // Cast to Number
        setRentEndDate(rentEndDateCalculated.format("YYYY-MM-DD"));
        setTotalAmount(Number(currentMonthlyRent) * (Number(payment_term) / 30)); // Cast to Number
        form.setFieldsValue({ rentEndDate: rentEndDateCalculated.format("YYYY-MM-DD"), rentStart: rentStartDate });
        console.log("rentStart and rentEnd set in form:", dayjs(rentStartDate).format("YYYY-MM-DD"), rentEndDateCalculated.format("YYYY-MM-DD"));
    } else if (currentMonthlyRent !== undefined) { // Handle case where only monthly rent is set
        setRentEndDate(null);
        form.setFieldsValue({ rentEndDate: null, rentStart: rentStartDate });
        setTotalAmount(Number(currentMonthlyRent));
    } else {
        setRentEndDate(null);
        form.setFieldsValue({ rentEndDate: null, rentStart: rentStartDate });
        setTotalAmount(0);
    }
};

const updateRentAndDeposit = (selectedRoom) => {
  if (selectedRoom && selectedRoom.monthlyRent) {
      const rent = Number(selectedRoom.monthlyRent); // Ensure it's a number
      setMonthlyRent(rent);
      setDeposit(Math.round(rent / 1.15)); // Calculate deposit without VAT
      form.setFieldsValue({ monthlyRent: rent, deposit: Math.round(rent / 1.15) }); // Update form fields as well
  } else {
      setMonthlyRent(0);
      setDeposit(0);
      form.setFieldsValue({ monthlyRent: 0, deposit: 0 }); // Update form fields as well
  }
};


// Filter available rooms based on selected stall and occupancy
useEffect(() => {
  let filteredRooms = allRooms; // Start with all rooms

  // Filter by selected stall
  if (selectedStallId) {
    filteredRooms = allRooms.filter((room) => room.stall_id === selectedStallId);
  } else {
     // If no stall is selected, there are no available rooms to show in the dropdown
     setAvailableRooms([]);
     return;
  }


  // Include the current tenant's room during editing if it belongs to the selected stall
  if (editingTenantId) {
    const currentTenant = allTenants.find((t) => t.id === editingTenantId);
    if (currentTenant) {
      const currentRoom = allRooms.find((r) => r.id === currentTenant.room);
      // Check if the current room exists, belongs to the selected stall, and is not already in the filtered list
      if (currentRoom && currentRoom.stall_id === selectedStallId && !filteredRooms.some(r => r.id === currentRoom.id)) {
        filteredRooms = [...filteredRooms, currentRoom]; // Force include the room
      }
    }
  }

  // Exclude rooms occupied by OTHER active tenants in the current building
  const occupiedRoomIdsInCurrentBuilding = allTenants
  .filter(tenant => tenant.terminated === 0 && Number(tenant.building_id) === buildingId && tenant.id !== editingTenantId)
  .map(tenant => tenant.room);

  const available = filteredRooms.filter((room) =>
    !occupiedRoomIdsInCurrentBuilding.includes(room.id)
  );


  console.log("Available Rooms for selected stall:", available); // Debugging
  setAvailableRooms(available);
}, [allRooms, allTenants, selectedStallId, editingTenantId, buildingId]);


useEffect(() => {
  const rentStartDate = form.getFieldValue("rentStartDate");
  const paymentTerm = form.getFieldValue("payment_term");
  const currentMonthlyRent = form.getFieldValue("monthlyRent"); // Get monthly rent from form

  if (rentStartDate && paymentTerm && currentMonthlyRent !== undefined) { // Check if monthlyRent is available
      const endDate = dayjs(rentStartDate).add(Number(paymentTerm), 'day'); // Cast to Number
      setRentEndDate(endDate.format("YYYY-MM-DD"));
      form.setFieldsValue({ rentEndDate: endDate.format("YYYY-MM-DD") });
        // Recalculate total amount here as well
        setTotalAmount(Number(currentMonthlyRent) * (Number(paymentTerm) / 30)); // Cast to Number
  } else if (currentMonthlyRent !== undefined) { // Handle case where only monthly rent is set
    setRentEndDate(null);
    form.setFieldsValue({ rentEndDate: null });
    setTotalAmount(Number(currentMonthlyRent));
  }
}, [form, monthlyRent, form.getFieldValue("rentStartDate"), form.getFieldValue("payment_term"), form.getFieldValue("monthlyRent")]); // Added monthlyRent field dependency


  // Fetch ALL tenants, terminated tenants, stalls, and rooms on component mount or buildingId change.
  useEffect(() => {
    if (!buildingId && !authLoading) {
       // Handle case where buildingId is not available after loading
       message.warning("Building ID not found. Please check your account.");
       // Optionally clear data states here if buildingId is expected but missing
       setAllTenants([]);
       setAllTerminatedTenants([]);
       setAllStalls([]);
       setAllRooms([]);
       return;
    }
    if (!buildingId) return; // Don't fetch if buildingId is null/undefined initially

    const fetchAllData = async () => {
        try {
            // Fetch all tenants (active and terminated if endpoint supports it, otherwise use separate)
            const tenantsResponse = await axios.get("http://localhost:5000/api/tenants");
            setAllTenants(tenantsResponse.data);

            // Fetch all terminated tenants (assuming this endpoint returns all terminated regardless of building)
            const terminatedResponse = await axios.get("http://localhost:5000/api/tenants/terminated");
            setAllTerminatedTenants(terminatedResponse.data);

            // Fetch all stalls
            const stallsResponse = await axios.get("http://localhost:5000/stalls");
            setAllStalls(stallsResponse.data);

            // Fetch all rooms
            const roomsResponse = await axios.get("http://localhost:5000/stalls/getRooms");
             const allRoomData =
                Array.isArray(roomsResponse.data) && Array.isArray(roomsResponse.data[0])
                ? roomsResponse.data.flat() // Use flat() to handle nested arrays
                : roomsResponse.data;
            setAllRooms(allRoomData);

        } catch (err) {
            message.error("Failed to fetch all data");
            console.error(err);
        }
    };

    fetchAllData();

  }, [buildingId, authLoading]); // Depend on buildingId and authLoading


// Filter data for display whenever the base data or buildingId changes
useEffect(() => {
    if (buildingId) {
        // Filter active tenants by buildingId
        const filteredActiveTenants = allTenants.filter(
            t => t.terminated === 0 && Number(t.building_id) === buildingId
        );
        setTenants(filteredActiveTenants);
        // Update activeRooms based on filtered active tenants
        setActiveRooms(filteredActiveTenants.map(t => t.room));


        // Filter terminated tenants by buildingId
        // Assuming allTerminatedTenants might also need filtering by building_id if the endpoint doesn't filter
        const filteredTerminatedTenants = allTerminatedTenants.filter(
            t => Number(t.building_id) === buildingId
        );
        setTerminatedTenants(filteredTerminatedTenants);

        // Filter stalls by buildingId for the stall selection dropdown
         const filteredStalls = allStalls.filter(
            stall => Number(stall.building_id) === buildingId
        );
        setStalls(filteredStalls);

    } else {
        // Clear displayed data if buildingId is not available
        setTenants([]);
        setTerminatedTenants([]);
        setStalls([]);
        setActiveRooms([]);
    }
}, [allTenants, allTerminatedTenants, allStalls, buildingId]); // Depend on the unfiltered data and buildingId


  const navigate = useNavigate()

  // Fetch ALL active tenants from back end (Modified to fetch all)
const fetchTenants = async () => {
  // This function is now primarily used to refetch ALL tenants and will be filtered in the effect above
  try {
    const response = await axios.get(`http://localhost:5000/api/tenants`);
    setAllTenants(response.data); // Update the state holding ALL tenants
  } catch (err) {
    message.error("Failed to refetch all tenants");
    console.error(err);
  }
};

  // Fetch ALL terminated tenants from back end (No change needed as it likely fetches all)
  const fetchTerminatedTenants = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/tenants/terminated");
      setAllTerminatedTenants(response.data); // Update the state holding ALL terminated tenants
    } catch (err) {
      message.error("Failed to refetch all terminated tenants");
      console.error(err);
    }
  };

  // The useEffect for fetching all stalls and rooms is now the primary source for this data.
  // We don't need separate fetchRooms and fetchStalls functions called directly in useEffects
  // unless you need to manually trigger a refetch of everything.

  const showModal = () => {
    setIsModalVisible(true);
    setActiveTab("1");
    form.resetFields();
    setIsAgentRegistered(false);
    setEditingTenantId(null); // Ensure editing state is reset for new tenant
    setSelectedStallId(null); // Reset selected stall
    setAvailableRooms([]); // Clear available rooms until stall is selected
    setMonthlyRent(0); // Reset monthly rent
    setDeposit(0); // Reset deposit
    setTotalAmount(0); // Reset total amount
    setContractEndDate(null); // Reset dates
    setRentEndDate(null); // Reset dates
     // Reset checkbox initial values
    form.setFieldsValue({
      eeu_payment: false,
      generator_payment: false,
      water_payment: false,
      registered_by_agent: false,
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setIsAgentRegistered(false);
    setEditingTenantId(null); // Reset editing state
    setSelectedStallId(null); // Reset selected stall
    setMonthlyRent(0); // Reset monthly rent
    setDeposit(0); // Reset deposit
    setTotalAmount(0); // Reset total amount
    setContractEndDate(null); // Reset dates
    setRentEndDate(null); // Reset dates
  };

  useEffect(() => {
    form.setFieldsValue({ deposit });
}, [deposit, form]); // Added form to dependency array


  // This function maps the front-end snake_case values to camelCase values expected at back end.
  // It also formats leasePeriod moment objects into strings.
  const handleOk = async () => {
    try {
        const values = await form.validateFields();

        console.log("editingTenantId:", editingTenantId); // Debugging
        console.log("Form Values:", values); // Debugging

        const formattedLeaseStart = values.contractStartDate
            ? dayjs(values.contractStartDate).format("YYYY-MM-DD")
            : null;

        const formattedLeaseEnd = contractEndDate; // Use contractEndDate state

        const formattedRentStart = values.rentStartDate
            ? dayjs(values.rentStartDate).format("YYYY-MM-DD")
            : null;

        const formattedRentEnd = rentEndDate; // Use rentEndDate state

        // Add validation for buildingId
        if (!buildingId) {
             message.error("Building ID is not available. Cannot add/update tenant.");
             return;
        }

        // Check if any date fields are null (re-checking as handleContractUpdate might not have run)
        // Also check if room is selected
        if (!formattedLeaseStart || !formattedLeaseEnd || !formattedRentStart || !formattedRentEnd || values.room === null || values.room === undefined) {
            message.error("Please fill all required fields including dates and room.");
            return; // Stop the function if any required field is null
        }

        const payload = {
            tenantID: values.tenant_id ?? "",
            organization:values.organization ?? "",
            fullName: values.full_name ?? "",
            sex: values.sex ?? "",
            phone: values.phone ?? "",
            city: values.city ?? "",
            subcity: values.subcity ?? "",
            woreda: values.woreda ?? "",
            house_no: values.house_no ?? "",
            room: values.room, // Use the selected room ID
            price: totalAmount, // Use the calculated total amount
            paymentTerm: values.payment_term ?? 0,
            deposit: Number(values.deposit) || 0, // Convert to number
            lease_start: formattedLeaseStart,
            lease_end: formattedLeaseEnd,
            rentStart: formattedRentStart,
            rentEnd: formattedRentEnd,
            eeuPayment: values.eeu_payment ?? false,
            generatorPayment: values.generator_payment ?? false,
            waterPayment: values.water_payment ?? false,
            registeredByAgent: values.registered_by_agent || false,
            authenticationNo: values.authentication_no ?? "",
            agentFirstName: values.agent_first_name ?? "",
            agentSex: values.agent_sex ?? "",
            agentPhone: values.agent_phone ?? "",
            agentCity: values.agent_city ?? "",
            agentSubcity: values.agent_subcity ?? "",
            agentWoreda: values.agent_woreda ?? "",
            agentHouseNo: values.agent_house_no ?? "",
            authenticationDate: values.authentication_date ? dayjs(values.authentication_date).format("YYYY-MM-DD") : null, // Added authentication date
            building_id: buildingId, // Use the buildingId from context
        };

        console.log("Payload being sent:", payload);

        if (editingTenantId) {
            console.log("Editing Tenant ID:", editingTenantId); // Debugging
            await axios.put(`http://localhost:5000/api/tenants/${editingTenantId}`, payload);
            message.success("Tenant updated successfully!");
        } else {
            await axios.post("http://localhost:5000/api/tenants", payload);
            message.success("Tenant added successfully!");
        }

        // Refetch ALL data after a successful operation
        fetchTenants(); // Refetches all tenants (will be filtered in effect)
        fetchTerminatedTenants(); // Refetches all terminated tenants (will be filtered in effect)
        // Assuming stall and room data doesn't need refetching on tenant change

        setIsModalVisible(false);
        form.resetFields();
        setIsAgentRegistered(false);
        setEditingTenantId(null); // Reset editingTenantId
        setSelectedStallId(null); // Reset selected stall
        setMonthlyRent(0); // Reset monthly rent
        setDeposit(0); // Reset deposit
        setTotalAmount(0); // Reset total amount
        setContractEndDate(null); // Reset dates
        setRentEndDate(null); // Reset dates
    } catch (error) {
        console.error("Error details:", error);
        console.log("Server Response:", error.response); // Debugging
        message.error("Failed to add/update tenant. Check the form and try again.");
    }
};

useEffect(() => {
  if (selectedStallId === null && !editingTenantId) { // Only reset room if not in editing mode and stall is unselected
      form.setFieldsValue({ room: null });
  }
}, [selectedStallId, form, editingTenantId]);

  const handleTerminate = async (record) => {
    try {
      await axios.put(`http://localhost:5000/api/tenants/terminate/${record.id}`);
      message.warning(`${record.full_name} has been terminated.`);
      // Refetch ALL data after termination
      fetchTenants(); // Refetches all tenants (will be filtered in effect)
      fetchTerminatedTenants(); // Refetches all terminated tenants (will be filtered in effect)
    } catch (error) {
      message.error("Failed to terminate tenant");
      console.error(error);
    }
  };


  const columns = [
    // { title: "Tenant ID", dataIndex: "tenant_id", key: "tenant_id" },
    { title: "Full Name", dataIndex: "full_name", key: "full_name" },
    // { title: "Sex", dataIndex: "sex", key: "sex" },

    { title: "Phone", dataIndex: "phone", key: "phone" },
    { title: "Room No", dataIndex: "roomName", key: "rooms" },
    {
      title: "Monthly Rent",
      dataIndex: "monthlyRent", // Use dataIndex now
      key: "monthlyRent",
      render: (rent) => {
            const numericRent = Number(rent); // Ensure numeric for formatting
          if (numericRent === 0) {
              return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericRent);
          } else if (numericRent) {
              return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericRent);
          } else {
              return "Not Found";
          }
      }
  },
    {
      title: "Lease Period",
      key: "leasePeriod",
      render: (_, record) =>
        `${dayjs(record.lease_start).format("YYYY-MM-DD")} to ${dayjs(record.lease_end).format("YYYY-MM-DD")}`
    },
    {
      title: "Registered by Agent",
      dataIndex: "registered_by_agent",
      key: "registered_by_agent",
      render: (flag) => (flag ? "Yes" : "No")
    },
    {
      title: owner ? "Actions":null,
      key: "actions",
      render: (_, record) => {
        if (!owner) {
          return null;
        }
        return(
          <Space size="middle">
             <Button
  type="link"
  icon={<EditOutlined />}
  onClick={(e) => {
    e.stopPropagation();
    console.log("Editing Tenant Record:", record); // Debugging

    // Find the room associated with the tenant from ALL rooms
    const roomObject = allRooms.find((room) => room.id === record.room);
    console.log("Room Object:", roomObject); // Debugging

    // Set the selected stall ID based on the room's stall_id
    if (roomObject) {
      setSelectedStallId(roomObject.stall_id); // Set stall ID to filter available rooms
      console.log("Selected Stall ID Set:", roomObject.stall_id); // Debugging
    } else {
          setSelectedStallId(null); // Reset if no room found
        }


    // Populate form fields
    form.setFieldsValue({
      ...record,
      stallCode: roomObject?.stall_id || null, // Map to stallCode (stall ID)
      room: roomObject?.id || null,             // Set room ID (not the whole object)
      monthlyRent: record.monthly_rent ? Number(record.monthly_rent) : 0,
      payment_term: record.payment_term ? Number(record.payment_term) : 30,
      rentStartDate: record.rent_start_date ? dayjs(record.rent_start_date) : dayjs(), // Use rent_start_date from backend
      contractStartDate: record.lease_start ? dayjs(record.lease_start) : dayjs(),
      lease_duration: record.lease_start && record.lease_end
        ? dayjs(record.lease_end).diff(dayjs(record.lease_start), "day")
        : 30,
        deposit: record.deposit ? Number(record.deposit) : 0, // Populate deposit
        registered_by_agent: record.registered_by_agent === 1, // Handle boolean checkbox
        eeu_payment: record.eeu_payment === 1, // Handle boolean checkbox
        generator_payment: record.generator_payment === 1, // Handle boolean checkbox
        water_payment: record.water_payment === 1, // Handle boolean checkbox
        authentication_date: record.authentication_date ? dayjs(record.authentication_date) : null, // Populate auth date
    });

    // Update state variables as well
    setMonthlyRent(record.monthly_rent ? Number(record.monthly_rent) : 0);
    setDeposit(record.deposit ? Number(record.deposit) : 0);
    setIsAgentRegistered(record.registered_by_agent === 1); // Set agent registered state


    // Force update contract/rent dates and total amount after setting form values
    setTimeout(() => {
      handleContractUpdate(); // Ensure dates and total amount recalculate after state/form updates
    }, 100);

    setEditingTenantId(record.id);
    setIsModalVisible(true);
    setActiveTab("1"); // Start on the first tab for editing
  }}
/>
              <Button
                  type="link"
                  icon={<DeleteOutlined />}
                  danger
                  onClick={(e) => {
                      e.stopPropagation(); // Also stop event propagation he
                      handleTerminate(record);
                  }}
              />
          </Space>
        )
      }
  }

  ];

  const terminatedColumns = columns.filter((col) => col.key !== "actions");

  return (
    <div style={{ padding: "20px" }}>
      <h2>Tenants</h2>
      {owner ? (<Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
        Add Tenant
      </Button>) : null }


      <Table columns={columns} dataSource={tenants} style={{ marginTop: 20 }} rowKey="id" onRow={(record) => ({
          onClick: () => {
            navigate(`/tenants/${record.id}`);
          }
        })} />

      {terminatedTenants.length > 0 && (
        <>
          <h2 style={{ marginTop: 40 }}>Terminated Tenants</h2>
          <Table columns={terminatedColumns} dataSource={terminatedTenants} style={{ marginTop: 20 }} rowKey="id" onRow={(record) => ({
          onClick: () => {
            navigate(`/tenants/${record.id}`);
          }
        })} />
        </>
      )}

      <Modal
        title={editingTenantId ? "Edit Tenant" : "Add New Tenant"}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={activeTab === "2" ? [
          <Button key="back" onClick={() => setActiveTab("1")}>
            Back: Tenant Info
          </Button>,
          <Button key="submit" type="primary" onClick={handleOk}>
            {editingTenantId ? "Update Tenant" : "Add Tenant"}
          </Button>
        ] : null}
  
      >
        <Form form={form} layout="vertical" initialValues={{
    eeu_payment: false,
    generator_payment: false,
    water_payment: false,
    registered_by_agent: false, // Added initial value for agent checkbox
  }}>
          {/* Ensure only two tabs are defined */}
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="Tenant Info" key="1">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                <Form.Item name="tenant_id" label="Tenant ID" rules={[{ required: true, message: "Please enter Tenant ID" }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="organization" label="Organization">
                  <Input />
                </Form.Item>
                <Form.Item name="full_name" label="Full Name" rules={[{ required: true, message: "Please enter Full Name" }]}>
                  <Input />
                </Form.Item>
                <Form.Item
  name="sex"
  label="Sex"
  rules={[{ required: true, message: "Please select Sex" }]}
>
  <Select placeholder="Select Sex">
    <Select.Option value="male">Male</Select.Option>
    <Select.Option value="female">Female</Select.Option>
  </Select>
</Form.Item>
                <Form.Item
  name="phone"
  label="Phone Number"
  rules={[
    {
      required: true,
      message: "Please enter Phone Number",
    },
    {
      validator: (_, value) => {
        if (!value) {
          return Promise.resolve(); // Allow empty if not required
        }

        // Updated regex for better validation
        if (/^(09|07)\d{8}$/.test(value) || value === 'farai') {
          return Promise.resolve();
        }

        return Promise.reject(
          new Error("Please enter a valid phone number starting with 09 or 07")
        );
      },
    },
  ]}
>
  <Input />
</Form.Item>
                <Form.Item name="city" label="City" rules={[{ required: true, message: "Please enter Tenant City" }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="subcity" label="Sub City" rules={[{ required: true, message: "Please enter Sub City" }]}>
                  <Input />
                </Form.Item>
                <Form.Item
  name="woreda"
  label="Woreda"
  rules={[
    { required: true, message: "Please enter Woreda" },

  ]}
>
  <Input />
</Form.Item>
                <Form.Item name="house_no" label="House No" rules={[{ required: true, message: "Please enter Tenant House No" }]}>
                  <Input />
                </Form.Item>
              </div>

              <Form.Item name="registered_by_agent" valuePropName="checked">
                <Checkbox
                  onChange={(e) => {
                    setIsAgentRegistered(e.target.checked);
                  }}
                >
                  Representative/Agent?
                </Checkbox>
              </Form.Item>

              {isAgentRegistered && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                  <Form.Item name="agent_first_name" label="Agent Full Name" rules={[{ required: isAgentRegistered, message: "Please enter Agent Full Name" }]}>
                    <Input />
                  </Form.Item>


                  <Form.Item
  name="agent_sex"
  label="Agent Sex"
  rules={[{ required: isAgentRegistered, message: "Please select Agent Sex" }]}
>
  <Select placeholder="Select Agent Sex">
    <Select.Option value="male">Male</Select.Option>
    <Select.Option value="female">Female</Select.Option>
  </Select>
</Form.Item>
                  <Form.Item name="agent_phone" label="Agent Phone" rules={[{ required: isAgentRegistered, message: "Please enter Agent Phone" }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="agent_city" label="Agent City" rules={[{ required: isAgentRegistered, message: "Please enter Agent City" }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="agent_subcity" label="Agent Sub City" rules={[{ required: isAgentRegistered, message: "Please enter Agent Sub City" }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="agent_woreda" label="Agent Woreda" rules={[{ required: isAgentRegistered, message: "Please enter Agent Woreda" }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="agent_house_no" label="Agent House No" rules={[{ required: isAgentRegistered, message: "Please enter Agent House No" }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="authentication_no" label="Authentication No" rules={[{ required: isAgentRegistered, message: "Please enter Authentication No" }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item
          name="authentication_date"
          label="Authentication Date"
          rules={[{ required: isAgentRegistered, message: "Please select authentication date" }]}
        >
          <DatePicker format="YYYY-MM-DD" />
        </Form.Item>
                </div>
              )}
            {/* Add a spacer or div to push the button down if needed */}
             <div style={{ height: isAgentRegistered ? '16px' : '0px' }}></div>

              <Button type="primary" onClick={() => {
                form.validateFields().then(() => setActiveTab("2")).catch(() => message.error('Please fill required fields in Tenant Info tab'));
             }}>
                Next: Payment Info
              </Button>
            </TabPane>
            <TabPane tab="Payment Info" key="2">
            <Form.Item
  name="stallCode" // This form item is for selecting the stall
  label="Stall Code"
  rules={[{ required: true, message: "Select Stall Code" }]}
>
  <Select
    placeholder="Select Stall Code"
    onChange={(stallId) => {
      setSelectedStallId(stallId);
      form.setFieldsValue({ room: null }); // Reset room on stall change
      updateRentAndDeposit(null); // Reset rent/deposit
      handleContractUpdate(); // Recalculate total amount after resetting rent
    }}
  >
    {stalls.map((stall) => ( // Use filtered stalls here
      <Select.Option
        key={stall.id}
        value={stall.id} // Use stall.id as the value (matches room.stall_id)
      >
        {stall.stallCode}
      </Select.Option>
    ))}
  </Select>
</Form.Item>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
    <Form.Item
  name="room" // This form item is for selecting the specific room
  label="Room"
  rules={[{ required: true, message: "Please select a room" }]}
>
  <Select
    placeholder="Select a room"
    onChange={(roomId) => {
      const numericId = Number(roomId);
      const selectedRoom = availableRooms.find(r => r.id === numericId);
      if (selectedRoom) {
        // Set the form field's value as the room's numeric id.
        form.setFieldsValue({ room: numericId });
        updateRentAndDeposit(selectedRoom);
        // handleContractUpdate(); // This is called within updateRentAndDeposit now
      } else {
        form.setFieldsValue({ room: null });
        updateRentAndDeposit(null);
        // handleContractUpdate(); // This is called within updateRentAndDeposit now
      }
    }}
    disabled={!selectedStallId || availableRooms.length === 0} // Disable if no stall is selected or no available rooms
  >
    {availableRooms.map(r => (
        <Select.Option key={r.id} value={r.id}>
          Room {r.roomName}
        </Select.Option>
      ))}
  </Select>
</Form.Item>

        <Form.Item name="monthlyRent" label="Monthly Rent">
            {/* Display the state value, linked to the form field name */}
            <Input readOnly value={monthlyRent} />
        </Form.Item>

        {/* Use form.Item for deposit to manage its state and validation */}
        <Form.Item name="deposit" label="Deposit">
            <Input readOnly value={deposit} /> {/* Display the state value */}
        </Form.Item>


    </div>

    <Row gutter={16} justify="start" align="middle">
        <Col xs={24} sm={8}>
            <Form.Item
                name="lease_duration"
                label="Lease Duration"
                rules={[{ required: true, message: "Please select lease duration" }]}
            >
                <Select
                    placeholder="Select lease duration"
                    onChange={(value) => {
                        form.setFieldsValue({ lease_duration: value });
                        handleContractUpdate();
                    }}
                >
                    {paymentTerms.map((term) => (
                        <Select.Option key={term.value} value={term.value}>
                            {term.label}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
            <Form.Item
                name="contractStartDate"
                label="Contract Start Date"
                rules={[{ required: true, message: "Please select contract start date" }]}
            >
                <DatePicker
                    format="YYYY-MM-DD"
                    onChange={(date) => {
                        form.setFieldsValue({ contractStartDate: date });
                        handleContractUpdate();
                    }}
                />
            </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
            <Form.Item label="Contract End Date">
                <span>{contractEndDate ? dayjs(contractEndDate).format("YYYY-MM-DD") : "Not Set"}</span>
            </Form.Item>
        </Col>
    </Row>

    <Row gutter={16} justify="start" align="middle">
        <Col xs={24} sm={8}>
            <Form.Item
                name="payment_term"
                label="Payment Term"
                rules={[{ required: true, message: "Please select the payment term" }]}
            >
                <Select
                    placeholder="Select payment term"
                    onChange={(value) => {
                        form.setFieldsValue({ payment_term: value });
                        handleContractUpdate();
                    }}
                >
                    {paymentTerms.map((term) => (
                        <Select.Option key={term.value} value={term.value}>
                            {term.label}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
            <Form.Item
                name="rentStartDate"
                label="Rent Start Date"
                rules={[{ required: true, message: "Please select rent start date" }]}
            >
                <DatePicker
                    format="YYYY-MM-DD"
                    onChange={(date) => {
                        form.setFieldsValue({ rentStartDate: date });
                        handleContractUpdate();
                    }}
                />
            </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
            <Form.Item label="Rent End Date">
                <span>{rentEndDate ? dayjs(rentEndDate).format("YYYY-MM-DD") : "Not Set"}</span>
            </Form.Item>
        </Col>
    </Row>

    <Form.Item label="Total Amount">
        <span>{totalAmount}</span>
    </Form.Item>
    <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
        <Form.Item name="eeu_payment" valuePropName="checked">
            <Checkbox>EEU Payment</Checkbox>
        </Form.Item>
        <Form.Item name="water_payment" valuePropName="checked">
            <Checkbox>Water Payment</Checkbox>
        </Form.Item>
        <Form.Item name="generator_payment" valuePropName="checked">
            <Checkbox>Generator Payment</Checkbox>
        </Form.Item>
    </div>
</TabPane>

          </Tabs>
        </Form>
      </Modal>
    </div>
  );
};

export default Tenants;