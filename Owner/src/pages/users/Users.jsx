import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, message } from "antd";
import axios from "axios";
import { useAuth } from "../../context/AuthContext"; // Adjust path as needed

const Users = () => {
  const [users, setUsers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Destructure full account data and accountType from the auth context.
  // Only if accountType is "owner", we consider it as an owner.
  const { account, accountType, authLoading } = useAuth();
  const owner = accountType === "owner" ? account : null;

  // Debug: log details for troubleshooting.
  useEffect(() => {
    console.log("Logged in account type:", accountType);
    console.log("Account from context:", account);
    console.log("Owner (if owner):", owner);
  }, [account, accountType, owner]);

  // Only fetch users if the logged-in account is an owner.
  useEffect(() => {
    if (!authLoading && owner) {
      fetchUsers();
    }
  }, [authLoading, owner]);

  // Define table columns.
  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Full Name", dataIndex: "full_name", key: "full_name" },
    { title: "Phone Number", dataIndex: "phone_number", key: "phone_number" },
    { title: "Role", dataIndex: "role", key: "role" },
  ];

  // Fetch users associated with the owner's building.
  const fetchUsers = async () => {
    try {
      console.log("Fetching users with building_id:", owner.id);
      const response = await axios.get("http://localhost:5000/api/users", {
        params: { building_id: owner.id },
      });
      console.log("Fetched users:", response.data);
      // Adjust according to your backend response format.
      setUsers(response.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      message.error("Error fetching users");
    }
  };

  // Only let an owner create a user.
  const handleCreateUser = async (values) => {
    // Prevent non-owners from using the creation function.
    if (!owner) {
      message.error("Only owners can create new users.");
      return;
    }
    setLoading(true);
    try {
      // Merge the owner's building id into the payload.
      const payload = { ...values, building_id: owner.id };
      console.log("Payload being sent:", payload);
      const response = await axios.post("http://localhost:5000/api/users", payload);
      console.log("User creation response:", response.data);
      // Append the new user to your users state.
      setUsers((prevUsers) => [...prevUsers, response.data.user]);
      message.success("User created successfully");
      form.resetFields();
      setModalVisible(false);
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
      
      {accountType === "owner" ? (
        <Button
          type="primary"
          onClick={() => setModalVisible(true)}
          style={{ marginBottom: "20px" }}
        >
          Add New User
        </Button>
      ) : (
        <p>Only owners can create new users.</p>
      )}

      <Table dataSource={users} columns={columns} rowKey="id" />

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
              <Select.Option value="finance">Finance</Select.Option>
              <Select.Option value="maintenance">Maintenance</Select.Option>
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
