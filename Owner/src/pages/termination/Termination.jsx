import React, { useState, useEffect } from "react";
import { Checkbox, Input, Upload, Button, message, Card, Table, Modal } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useLocation } from "react-router-dom";

const Termination = () => {
  const location = useLocation();
  const tenantData = location.state?.tenant || {};

  const [depositReturn, setDepositReturn] = useState(false);
  const [terminationCode, setTerminationCode] = useState("");
  const [fileList, setFileList] = useState([]);
  const [terminatedTenants, setTerminatedTenants] = useState([
    {
      key: "1",
      tenantID: "T-001",
      name: "John Doe",
      contractStart: "2024-01-01",
      contractEnd: "2024-12-31",
      depositReturned: "Yes",
    },
  ]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (tenantData?.tenantID) {
      setTerminationCode("");
    }
  }, [tenantData]);

  // Handle File Upload
  const handleUpload = ({ file, fileList }) => {
    setFileList(fileList);
    message.success(`${file.name} uploaded successfully`);
  };

  // Handle Termination Submission
  const handleSubmit = () => {
    if (!terminationCode) {
      message.error("Please enter a termination code!");
      return;
    }

    if (!tenantData.tenantID) {
      message.error("No tenant selected for termination!");
      return;
    }

    const newTerminatedTenant = {
      key: `${terminatedTenants.length + 1}`,
      tenantID: tenantData.tenantID,
      name: tenantData.name,
      contractStart: tenantData.contractStart,
      contractEnd: tenantData.contractEnd,
      depositReturned: depositReturn ? "Yes" : "No",
    };

    setTerminatedTenants([...terminatedTenants, newTerminatedTenant]);
    setTerminationCode("");
    setFileList([]);
    setDepositReturn(false);

    message.success("Termination processed successfully!");
    setIsModalVisible(false); // Close the modal after submission
  };

  // Table Columns
  const columns = [
    { title: "Tenant ID", dataIndex: "tenantID", key: "tenantID" },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Contract Start", dataIndex: "contractStart", key: "contractStart" },
    { title: "Contract End", dataIndex: "contractEnd", key: "contractEnd" },
    { title: "Deposit Returned", dataIndex: "depositReturned", key: "depositReturned" },
  ];

  return (
    <>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <Card
        title="Tenant Termination"
        className="mb-4"
        
      >
        <p>
          <strong>Selected Tenant:</strong> {tenantData.name || "No tenant selected"}
        </p>
        <Checkbox  checked={depositReturn} onChange={() => setDepositReturn(!depositReturn)}>
          Return Deposit
        </Checkbox>

        <div className="mt-3" style={{ display: "flex", padding: "7px", justifyContent: "space-between" }}>
          <div>
            <strong>Contract Start Date:</strong>
            <Input value={tenantData.contractStart || "N/A"} readOnly />
          </div>
          <div>
            <strong>Contract End Date:</strong>
            <Input value={tenantData.contractEnd || "N/A"} readOnly />
          </div>
        </div>

        <div className="mt-3">
          <strong>Termination Code:</strong>
          <Input
            value={terminationCode}
            onChange={(e) => setTerminationCode(e.target.value)}
            placeholder="Enter termination code"
          />
        </div>

        <div className="mt-3">
          <strong>Upload Termination Document:</strong>
          <Upload fileList={fileList} beforeUpload={() => false} onChange={handleUpload}>
            <Button icon={<UploadOutlined />}>Upload PDF / Image</Button>
          </Upload>
        </div>

        <Button type="primary" className="mt-3" onClick={() => setIsModalVisible(true)}>
          Submit Termination
        </Button>
      </Card>

      {/* Modal for Confirmation */}
      <Modal
        title="Confirm Termination"
        visible={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText="Confirm"
        cancelText="Cancel"
      >
        <p>Are you sure you want to terminate the tenant's contract?</p>
      </Modal>
    </div>
    <Card title="Terminated Tenants" style={{}}>
        <Table columns={columns} dataSource={terminatedTenants} pagination={{ pageSize: 5 }} />
      </Card>
    </>
  );
};

export default Termination;