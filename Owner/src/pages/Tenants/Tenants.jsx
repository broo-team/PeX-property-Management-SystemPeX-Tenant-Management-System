
import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Checkbox, DatePicker, message, Select, Tabs, Space, Col, Row } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
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
  const [tenants, setTenants] = useState([]);
  const [terminatedTenants, setTerminatedTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [activeRooms, setActiveRooms] = useState([]); // list of rooms currently occupied
  const [stalls, setStalls] = useState([]);
  const [contractEndDate, setContractEndDate] = useState(null);
  const [rentEndDate, setRentEndDate] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [editingTenantId, setEditingTenantId] = useState(null)
  // ... other state variables and functions ...
  const [monthlyRent, setMonthlyRent] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [selectedStall, setSelectedStall] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedStallId, setSelectedStallId] = useState(null);

  const { account, accountType, authLoading } = useAuth();
  const owner = accountType === "owner" ? account : null;

  const handleContractUpdate = () => {
    const contractStartDate = form.getFieldValue("contractStartDate");
    const lease_duration = form.getFieldValue("lease_duration");
    const rentStartDate = form.getFieldValue("rentStartDate");
    const payment_term = form.getFieldValue('payment_term');


    console.log("contractStartDate:", contractStartDate);
    console.log("lease_duration:", lease_duration);
    console.log("rentStartDate:", rentStartDate);
    console.log("payment_term:", payment_term);

    if (contractStartDate && lease_duration) {
        const endDate = dayjs(contractStartDate).add(lease_duration, "day");
        setContractEndDate(endDate.format("YYYY-MM-DD"));
        form.setFieldsValue({ contractEndDate: endDate.format("YYYY-MM-DD") });

        const leaseStart = dayjs(contractStartDate);
        const leaseEnd = dayjs(endDate);
        form.setFieldsValue({
            lease_start: leaseStart,
            lease_end: leaseEnd
        });
        console.log("lease_start and lease_end set in form:", leaseStart.format("YYYY-MM-DD"), leaseEnd.format("YYYY-MM-DD"));
    }

    if (rentStartDate && payment_term) {
        const rentEndDateCalculated = dayjs(rentStartDate).add(payment_term, 'day');
        setRentEndDate(rentEndDateCalculated.format("YYYY-MM-DD"));
        setTotalAmount(monthlyRent * (payment_term / 30));
        form.setFieldsValue({ rentEndDate: rentEndDateCalculated.format("YYYY-MM-DD"), rentStart: rentStartDate });
        console.log("rentStart and rentEnd set in form:", dayjs(rentStartDate).format("YYYY-MM-DD"), rentEndDateCalculated.format("YYYY-MM-DD"));
    }

    if (payment_term && monthlyRent) {
        setTotalAmount(monthlyRent * (payment_term / 30));
    } else {
        setTotalAmount(monthlyRent);
    }
};
const updateRentAndDeposit = (selectedRoom) => {
  if (selectedRoom && selectedRoom.monthlyRent) {
      setMonthlyRent(selectedRoom.monthlyRent);
      setDeposit(Math.round(selectedRoom.monthlyRent / 1.15)); // Calculate deposit without VAT
  } else {
      setMonthlyRent(0);
      setDeposit(0);
  }
};


useEffect(() => {
  let filteredRooms = rooms;

  // Filter by selected stall
  if (selectedStallId) {
    filteredRooms = rooms.filter((room) => room.stall_id === selectedStallId);
  }

  // Include the current tenant's room during editing
  if (editingTenantId) {
    const currentTenant = tenants.find((t) => t.id === editingTenantId);
    if (currentTenant) {
      const currentRoom = rooms.find((r) => r.id === currentTenant.room);
      if (currentRoom && !filteredRooms.some(r => r.id === currentRoom.id)) {
        filteredRooms = [...filteredRooms, currentRoom]; // Force include the room
      }
    }
  }

  // Exclude rooms occupied by OTHER tenants
  const available = filteredRooms.filter((room) => {
    const isOccupied = tenants.some(
      (tenant) => 
        tenant.room === room.id && 
        tenant.id !== editingTenantId && // Skip current tenant
        tenant.terminated === 0
    );
    return !isOccupied;
  });

  console.log("Available Rooms:", available); // Debugging
  setAvailableRooms(available);
}, [rooms, tenants, selectedStallId, editingTenantId]);
useEffect(() => {
  const rentStartDate = form.getFieldValue("rentStartDate");
  const paymentTerm = form.getFieldValue("payment_term");

  if (rentStartDate && paymentTerm) {
      const endDate = dayjs(rentStartDate).add(paymentTerm, 'day');
      setRentEndDate(endDate.format("YYYY-MM-DD"));
      form.setFieldsValue({ rentEndDate: endDate.format("YYYY-MM-DD") });
  }
}, [form]);
  // Fetch tenants, terminated tenants and all room (stall) information on component mount.
  useEffect(() => {
    fetchTenants();
    fetchTerminatedTenants();
    fetchRooms();
  }, []);

  // Fetch active tenants from back end
  const fetchTenants = async () => {
    try {
        const response = await axios.get("http://localhost:5000/api/tenants");
        const activeTenants = response.data.filter(tenant => tenant.terminated === 0); // Filter active tenants
        setTenants(activeTenants);
        const occupiedRooms = activeTenants.map((tenant) => tenant.room);
        setActiveRooms(occupiedRooms);
    } catch (err) {
        message.error("Failed to fetch tenants");
        console.error(err);
    }
};
  

  const navigate = useNavigate()
  // Fetch terminated tenants from back end
  const fetchTerminatedTenants = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/tenants/terminated");
      setTerminatedTenants(response.data);
    } catch (err) {
      message.error("Failed to fetch terminated tenants");
      console.error(err);
    }
  };



  // Fetch stall (room) information from back end
  const fetchRooms = async () => {
    try {
      const response = await axios.get("http://localhost:5000/stalls");
      setRooms(response.data);
    } catch (err) {
      message.error("Failed to fetch rooms");
      console.error(err);
    }
  };
  useEffect(() => {
    Promise.all([
        fetch('http://localhost:5000/stalls').then(response => response.json()),
        fetch('http://localhost:5000/stalls/getRooms').then(response => response.json())
    ])
        .then(([stallData, roomData]) => {
            setStalls(stallData);
            const flattenedRooms = roomData.flat();
            setRooms(flattenedRooms);
            console.log("Flattened Room Data:", flattenedRooms); // Check here
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}, []);

useEffect(() => {
  let filteredRooms = rooms;

  if (selectedStallId) {
      filteredRooms = rooms.filter((room) => room.stall_id === selectedStallId);
  }
  const available = filteredRooms.filter((room) => {
      // Check if the room is assigned to an active tenant
      const isRoomTaken = tenants.some(
          (tenant) => tenant.room === room.id && tenant.terminated === 0 // Assuming 0 means not terminated
      );
      return !isRoomTaken;
  });

  setAvailableRooms(available);
  console.log("available rooms:", available);
  console.log("active rooms:", tenants.filter(tenant => tenant.terminated === 0));
}, [rooms, tenants, selectedStallId]);
  // Compute available rooms: filter out rooms that are occupied by an active tenant.
  // We assume that in the room data, the property we want to use for display is called "room".
  // If your back-end returns stall objects with a property "stallCode" but you want to map that to room,
  // you can adjust the mapping here accordingly.
  const showModal = () => {
    setIsModalVisible(true);
    setActiveTab("1");
    form.resetFields();
    setIsAgentRegistered(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setIsAgentRegistered(false);
  };

  useEffect(() => {
    form.setFieldsValue({ deposit });
}, [deposit]);

  

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

        // Check if any date fields are null
        if (!formattedLeaseStart || !formattedLeaseEnd || !formattedRentStart || !formattedRentEnd) {
            message.error("Please fill all the date fields");
            return; // Stop the function if any date field is null
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
            room: values.room ?? null,
            price: values.price ?? totalAmount,
            paymentTerm: values.payment_term ?? 0,
            deposit: parseFloat(values.deposit) || 0, // Convert to number
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
            building_id: values.building_id || 3,
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

        fetchTenants();
        fetchTerminatedTenants();
        setIsModalVisible(false);
        form.resetFields();
        setIsAgentRegistered(false);
        setEditingTenantId(null); // Reset editingTenantId
    } catch (error) {
        console.error("Error details:", error);
        console.log("Server Response:", error.response); // Debugging
        message.error("Failed to add/update tenant. Check the form and try again.");
    }
};

useEffect(() => {
  if (selectedStallId === null) {
      form.setFieldsValue({ room: null });
  }
}, [selectedStallId, form]);
  const handleTerminate = async (record) => {
    try {
      await axios.put(`http://localhost:5000/api/tenants/terminate/${record.id}`);
      message.warning(`${record.full_name} has been terminated.`);
      fetchTenants();
      fetchTerminatedTenants();
    } catch (error) {
      message.error("Failed to terminate tenant");
      console.error(error);
    }
  };

  useEffect(() => {
    axios.get("http://localhost:5000/stalls")
      .then((response) => {
        console.log("Stalls Data:", response.data); // Debugging
        setStalls(response.data);
      })
      .catch((error) => console.error("Error fetching stalls:", error));
  }, []);
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
          if (rent === 0) {
              return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(rent);
          } else if (rent) {
              return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(rent);
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
      title: "Actions",
      key: "actions",
      render: (_, record) => (
          <Space size="middle">
             <Button
  type="link"
  icon={owner ?<EditOutlined /> : `only admin can take action`}
  onClick={(e) => {
    e.stopPropagation();
    console.log("Editing Tenant Record:", record); // Debugging

    // Find the room associated with the tenant
    const roomObject = rooms.find((room) => room.id === record.room);
    console.log("Room Object:", roomObject); // Debugging

    // Set the selected stall ID based on the room's stall_id
    if (roomObject) {
      setSelectedStallId(roomObject.stall_id); // Set stall ID to filter rooms
      console.log("Selected Stall ID Set:", roomObject.stall_id); // Debugging
    }

    // Populate form fields
    form.setFieldsValue({
      ...record,
      stallCode: roomObject?.stall_id || null, // Map to stallCode (stall ID)
      room: roomObject?.id || null,             // Set room ID (not the whole object)
      monthlyRent: record.monthly_rent ? Number(record.monthly_rent) : 0,
      payment_term: record.payment_term ? Number(record.payment_term) : 30,
      rentStartDate: record.rent_start ? dayjs(record.rent_start) : dayjs(),
      contractStartDate: record.lease_start ? dayjs(record.lease_start) : dayjs(),
      lease_duration: record.lease_start && record.lease_end 
        ? dayjs(record.lease_end).diff(dayjs(record.lease_start), "day") 
        : 30,
    });
    

    // Force update contract/rent dates
    setTimeout(() => {
      handleContractUpdate(); // Ensure dates recalculate after state updates
    }, 100);

    setEditingTenantId(record.id);
    setIsModalVisible(true);
    setActiveTab("1");
  }}
/>
              <Button
                  type="link"
                  icon={owner?<DeleteOutlined />:null}
                  danger
                  onClick={(e) => {
                      e.stopPropagation(); // Also stop event propagation he
                      handleTerminate(record);
                  }}
              />
          </Space>
      )
  }
    
  ];

  const terminatedColumns = columns.filter((col) => col.key !== "actions");

  return (
    <div style={{ padding: "20px" }}>
      <h2>Tenants</h2>
      {owner ? (<Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
        Add Tenant
      </Button>) : <div>tenants only create by admin</div> }
      

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
        title="Add New Tenant"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={activeTab === "2" ? [
          <Button key="back" onClick={() => setActiveTab("1")}>
            Back: Tenant Info
          </Button>,
          <Button key="submit" type="primary" onClick={handleOk}>
            Submit
          </Button>
        ] : null}
      >
        <Form form={form} layout="vertical" initialValues={{
    eeu_payment: false,
    generator_payment: false,
    water_payment: false,
  }}>
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

        if (value.startsWith("09") || value.startsWith("07") || value.startsWith("farai")) {
          return Promise.resolve();
        }

        return Promise.reject(
          new Error("Please enter a phone number starting with 09 or 07")
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

              <Form.Item>
                <Checkbox
                  checked={isAgentRegistered}
                  onChange={(e) => {
                    form.setFieldsValue({ registered_by_agent: e.target.checked });
                    setIsAgentRegistered(e.target.checked);
                  }}
                >
                  Representative/Agent?
                </Checkbox>
              </Form.Item>

              {isAgentRegistered && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                  <Form.Item name="agent_first_name" label="Agent Full Name" rules={[{ required: true, message: "Please enter Agent Full Name" }]}>
                    <Input />
                  </Form.Item>
                  
                  
                  <Form.Item
  name="agent_sex"
  label="Agent Sex"
  rules={[{ required: true, message: "Please select Agent Sex" }]}
>
  <Select placeholder="Select Agent Sex">
    <Select.Option value="male">Male</Select.Option>
    <Select.Option value="female">Female</Select.Option>
  </Select>
</Form.Item>
                  <Form.Item name="agent_phone" label="Agent Phone" rules={[{ required: true, message: "Please enter Agent Phone" }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="agent_city" label="Agent City" rules={[{ required: true, message: "Please enter Agent City" }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="agent_subcity" label="Agent Sub City" rules={[{ required: true, message: "Please enter Agent Sub City" }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="agent_woreda" label="Agent Woreda" rules={[{ required: true, message: "Please enter Agent Woreda" }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="agent_house_no" label="Agent House No" rules={[{ required: true, message: "Please enter Agent House No" }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="authentication_no" label="Authentication No" rules={[{ required: true, message: "Please enter Agent No" }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item 
          name=""
          label="Authenticati Date"
          rules={[{ required: true, message: "Please select rent End Date" }]}
        >
          <DatePicker format="YYYY-MM-DD" />
        </Form.Item>
                </div>
              )}

              <Button type="primary" onClick={() => setActiveTab("2")}>
                Next: Payment Info
              </Button>
            </TabPane>
            <TabPane tab="Payment Info" key="2">
            <Form.Item
  name="stallCode"
  label="Stall Code"
  rules={[{ required: true, message: "Select Stall Code" }]}
>
  <Select
    placeholder="Select Stall Code"
    onChange={(stallId) => {
      setSelectedStallId(stallId);
      form.setFieldsValue({ room: null }); // Reset room on stall change
    }}
  >
    {stalls.map((stall) => (
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
  name="room"
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
        handleContractUpdate();
      } else {
        form.setFieldsValue({ room: null });
        updateRentAndDeposit(null);
        handleContractUpdate();
      }
    }}
    disabled={!selectedStallId} // Disable if no stall is selected
  >
    {availableRooms
      .filter(room => {
        const activeRoomIds = tenants
          .filter(tenant => tenant.terminated === 0)
          .map(tenant => tenant.room.toString());
        return room.id && !activeRoomIds.includes(room.id.toString());
      })
      .map(r => (
        <Select.Option key={r.id} value={r.id}>
          Room {r.roomName}
        </Select.Option>
      ))}
  </Select>
</Form.Item>

        <Form.Item label="Monthly Rent">
            <span>{monthlyRent}</span>
        </Form.Item>
        <Form form={form} initialValues={{ deposit }}>
    <Form.Item name="deposit" label="Deposit">
        <Input readOnly />
    </Form.Item>
</Form>

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