import React, { useState, useEffect, useCallback, useRef, useMemo } from "react"; // Import useRef
import { Table, Button, Modal, Form, Input, Select, message } from "antd";
import axios from "axios";
import { useAuth } from "../../context/AuthContext"; // Adjust path as needed

// Base API URL.
const API_BASE = "http://localhost:5000/api"; // Use your actual API base URL

const Users = () => {
  // State to hold ALL fetched users
  const [allUsers, setAllUsers] = useState([]);
  // State for filtered users to be displayed
  const [users, setUsers] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Get buildingId from auth context
  const { account, accountType, authLoading, buildingId } = useAuth();
  const owner = accountType === "owner" ? account : null;

  // Ref to track if we've already attempted to fetch users for the current buildingId
  const fetchedForBuildingId = useRef(null);


  // Debug: log details for troubleshooting.
  useEffect(() => {
    console.log("Logged in account type:", accountType);
    console.log("Account from context:", account);
    console.log("Owner (if owner):", owner);
    console.log("Building ID from context:", buildingId);
  }, [account, accountType, owner, buildingId]);

  // Fetch ALL users from the backend.
  // Memoized with useCallback as it's used in a dependency array.
  const fetchAllUsers = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching ALL users...");
      // Fetch ALL users without any filtering parameters
      const response = await axios.get(`${API_BASE}/users`);
      console.log("Fetched ALL users:", response.data);
      setAllUsers(response.data || []); // Store all users

    } catch (error) {
      console.error("Error fetching all users:", error);
      message.error("Error fetching users");
      setAllUsers([]); // Clear users on error
    } finally {
        setLoading(false);
    }
  }, []); // Empty dependency array ensures this function reference is stable

  // Trigger fetching ALL users when auth status/owner changes
  // Use ref to prevent infinite loops by only fetching once per buildingId/owner state
  useEffect(() => {
    // Only attempt to fetch if auth is loaded, user is an owner, and buildingId is available
    if (!authLoading && owner && buildingId) {
        // Check if we have already fetched for this specific buildingId
        if (fetchedForBuildingId.current !== buildingId) {
             console.log(`Owner status and buildingId=${buildingId} confirmed, triggering fetch.`);
             fetchedForBuildingId.current = buildingId; // Mark this buildingId as fetched
             fetchAllUsers(); // Call the memoized fetch function
        } else {
            console.log(`Already fetched for buildingId=${buildingId}.`);
        }
    } else if (!authLoading && !owner) {
        // If not an owner, clear any users and reset the ref
        console.log("Not an owner, clearing users.");
        setAllUsers([]);
        setUsers([]);
        fetchedForBuildingId.current = null; // Reset ref
    } else if (!authLoading && owner && !buildingId) {
         // If owner but no buildingId after auth loading, clear users and show warning
         console.log("Owner found, but buildingId is missing.");
         setAllUsers([]);
         setUsers([]);
         fetchedForBuildingId.current = null; // Reset ref
         message.warning("Building ID not found for the owner. Cannot fetch users.");
    }
    // Dependencies for this effect: fetchAllUsers (stable), authLoading, owner, buildingId
}, [authLoading, owner, buildingId, fetchAllUsers]);


  // Filter users for display when allUsers or buildingId changes.
  useEffect(() => {
    if (buildingId) {
        console.log(`Filtering allUsers by buildingId: ${buildingId}`);
      // Filter the ALL users list by the current buildingId
      const filtered = allUsers.filter(user => Number(user.building_id) === buildingId);
      console.log("Filtered users for display:", filtered);
      setUsers(filtered); // Set the displayed users to the filtered list
    } else {
        // If buildingId is not available, clear the displayed users
        console.log("Building ID not available for filtering, clearing displayed users.");
        setUsers([]);
    }
    // Dependencies: allUsers (updated by fetchAllUsers), buildingId (from auth context)
  }, [allUsers, buildingId]);

  // Define table columns.
  const columns = useMemo(() => [ // Memoize columns if they don't depend on state
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Full Name", dataIndex: "full_name", key: "full_name" },
    { title: "Phone Number", dataIndex: "phone_number", key: "phone_number" },
    { title: "Role", dataIndex: "role", key: "role" },
    { title: "Building ID", dataIndex: "building_id", key: "building_id" }, // Keep building_id column for verification
  ], []); // Empty dependency array for columns

  // Only let an owner create a user.
  // MODIFIED: Use buildingId from context in the payload and refetch all users.
  const handleCreateUser = async (values) => {
    // Prevent non-owners from using the creation function.
    if (!owner) {
      message.error("Only owners can create new users.");
      return;
    }
    if (!buildingId) {
        message.error("Building ID is not available. Cannot create user.");
        return;
    }
    setLoading(true);
    try {
      // Include the correct building id in the payload.
      const payload = { ...values, building_id: buildingId }; // Use buildingId from context
      console.log("Payload being sent:", payload);
      const response = await axios.post(`${API_BASE}/users`, payload);
      console.log("User creation response:", response.data);

      message.success("User created successfully");
      form.resetFields();
      setModalVisible(false);

      // Refetch ALL users after creation to update the list and trigger filtering
      fetchAllUsers(); // Call the memoized fetch function

    } catch (error) {
      console.error("Error creating user:", error);
      const errorMessage =
        error.response && error.response.data && error.response.data.message
          ? error.response.data.message
          : "User creation failed";
      message.error(errorMessage);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Users Management</h1>

      {/* Only show the Add New User button if the user is an owner and buildingId is available */}
      {accountType === "owner" && buildingId ? (
        <Button
          type="primary"
          onClick={() => setModalVisible(true)}
          style={{ marginBottom: "20px" }}
        >
          Add New User
        </Button>
      ) : accountType === "owner" && !buildingId ? (
           <p>Building ID not found. Cannot add users.</p>
      ) : (
        <p>Only owners can manage users.</p>
      )}

      {/* Table displays the filtered users */}
      <Table dataSource={users} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title="Add New User"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateUser}>
          <Form.Item
            label="Full Name"
            name="full_name"
            rules={[{ required: true, message: "Please enter full name" }]}
          >
            <Input placeholder="Full Name" />
          </Form.Item>
          <Form.Item
            label="Phone Number"
            name="phone_number"
            rules={[{ required: true, message: "Please enter phone number" }]}
          >
            <Input placeholder="Phone Number" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please enter password" }]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>
          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true, message: "Please select a role" }]}
          >
            <Select placeholder="Select a role">
              {/* Assuming these are the allowed roles */}
              <Select.Option value="finance">Finance</Select.Option>
              <Select.Option value="maintenance">Maintenance</Select.Option>
              {/* Add other roles if needed */}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Create User
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;