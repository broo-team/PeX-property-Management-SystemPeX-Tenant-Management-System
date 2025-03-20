import React, { useState } from "react";
import { Form, Input, Button, Card, Table, Modal, Select, Tag, Upload, Tabs } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const { Option } = Select;
const { TabPane } = Tabs;

const BuildingRegistration = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false); // State to control modal visibility
  const [activeTab, setActiveTab] = useState("1"); // State to manage active tab
  const [buildingData, setBuildingData] = useState([]); // State to store submitted building data

  const showModal = () => {
    setIsModalVisible(true);
    setActiveTab("1"); // Reset to the first tab when modal opens
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields(); // Reset the form when modal is closed
  };

  const handleSubmit = (values) => {
    console.log("Form Data:", values);
    const newBuilding = { ...values, id: buildingData.length + 1 };
    setBuildingData([...buildingData, newBuilding]); // Add new data to the table
    setIsModalVisible(false); // Close the modal
    form.resetFields(); // Reset the form
  };

  const columns = [
    {
      title: "Building Name",
      dataIndex: "buildingName",
      key: "buildingName",
    },
    {
      title: "Property Type",
      dataIndex: "propertyType",
      key: "propertyType",
      render: (type) => (
        <Tag color={type === "Commercial" ? "blue" : type === "Residential" ? "green" : "orange"}>
          {type}
        </Tag>
      ),
    },
    {
      title: "Owner Email",
      dataIndex: "ownerEmail",
      key: "ownerEmail",
    },
    {
      title: "Owner Phone",
      dataIndex: "ownerPhone",
      key: "ownerPhone",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <span>
          <Button type="link" onClick={() => handleUpdate(record)}>Update</Button>
          <Button type="link" danger onClick={() => handleSuspend(record)}>Suspend</Button>
        </span>
      ),
    },
  ];

  const handleUpdate = (record) => {
    console.log("Update:", record);
    // Implement update logic here
  };

  const handleSuspend = (record) => {
    console.log("Suspend:", record);
    // Implement suspend logic here
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Register Building Button */}
      <Button type="primary" onClick={showModal} style={{ marginBottom: 16 }}>
        Register Building
      </Button>

      {/* Modal for Building Registration Form */}
      <Modal
        title="Register a Building"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null} // Remove default footer buttons
        width={800} // Set modal width
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Building Info Tab */}
          <TabPane tab="Building Info" key="1">
            <Form form={form} layout="vertical" onFinish={() => setActiveTab("2")}>
              <Form.Item
                label="Building Name"
                name="buildingName"
                rules={[{ required: true, message: "Please enter the building name" }]}
              >
                <Input placeholder="Enter building name" />
              </Form.Item>

              <Form.Item
                label="Building Image"
                name="buildingImage"
                rules={[{ required: true, message: "Please upload a building image" }]}
              >
                <Upload>
                  <Button icon={<UploadOutlined />}>Upload Image</Button>
                </Upload>
              </Form.Item>

              <Form.Item
                label="Building Address"
                name="buildingAddress"
                rules={[{ required: true, message: "Please enter the address" }]}
              >
                <Input placeholder="Enter address" />
              </Form.Item>

              <Form.Item
                label="Location"
                name="location"
                rules={[{ required: true, message: "Please enter the location" }]}
              >
                <Input placeholder="Enter location" />
              </Form.Item>

              <Form.Item
                label="Property Type"
                name="propertyType"
                rules={[{ required: true, message: "Please select the property type" }]}
              >
                <Select placeholder="Select property type">
                  <Option value="Commercial">Commercial</Option>
                  <Option value="Residential">Residential</Option>
                  <Option value="Mixed">Mixed</Option>
                </Select>
              </Form.Item>

              <Form.Item style={{ textAlign: "right" }}>
                <Button onClick={handleCancel} style={{ marginRight: 8 }}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit">
                  Next: Owner Info
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* Owner Info Tab */}
          <TabPane tab="Owner Info" key="2">
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                label="Owner Email"
                name="ownerEmail"
                rules={[
                  { required: true, message: "Please enter the owner's email" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input placeholder="Enter owner's email" />
              </Form.Item>

              <Form.Item
                label="Owner Phone"
                name="ownerPhone"
                rules={[
                  { required: true, message: "Please enter the owner's phone number" },
                  { pattern: /^[0-9+()\s-]+$/, message: "Invalid phone number format" },
                ]}
              >
                <Input placeholder="Enter owner's phone number" />
              </Form.Item>

              <Form.Item
                label="Owner Address"
                name="ownerAddress"
                rules={[{ required: true, message: "Please enter the owner's address" }]}
              >
                <Input placeholder="Enter owner's address" />
              </Form.Item>

              <Form.Item style={{ textAlign: "right" }}>
                <Button onClick={() => setActiveTab("1")} style={{ marginRight: 8 }}>
                  Back
                </Button>
                <Button type="primary" htmlType="submit">
                  Register
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Modal>
      {/* Table to Display Submitted Data */}
      <Table
        columns={columns}
        dataSource={buildingData}
        rowKey="id"
        style={{ marginTop: 16 }}
      />
    </div>
  );
};

export default BuildingRegistration;