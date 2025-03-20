import React, { useState, useEffect } from "react";
import { Table, Button, message, Upload, Modal, Select } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import axios from "axios";

const PartnersManagement = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPartner, setCurrentPartner] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadType, setUploadType] = useState("image"); // default to "image"

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:5000/award/partner/getpartners"
      );
      setPartners(response.data);
    } catch (error) {
      message.error("Failed to fetch partners.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !uploadType) {
      return message.error("Please select a file and upload type.");
    }

    const formData = new FormData();
    formData.append(uploadType, file);

    try {
      if (currentPartner) {
        await axios.put(
          `http://localhost:5000/award/partner/update-partner/${currentPartner.id}/${uploadType}`,
          formData
        );
        message.success(
          `${uploadType === "image" ? "Image" : "Logo"} updated successfully!`
        );
      } else {
        await axios.post(
          `http://localhost:5000/award/partner/partners/${uploadType}`,
          formData
        );
        message.success(
          `${uploadType === "image" ? "Image" : "Logo"} added successfully!`
        );
      }
      fetchPartners();
      setFile(null);
      setIsModalOpen(false);
    } catch (error) {
      message.error(`Failed to upload ${uploadType}.`);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "index",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      render: (text) =>
        text && (
          <img
            src={`http://localhost:5000/uploads/${text}`}
            alt="Image"
            width={50}
          />
        ),
    },
    {
      title: "Logo",
      dataIndex: "logo",
      key: "logo",
      render: (text) =>
        text && (
          <img
            src={`http://localhost:5000/uploads/${text}`}
            alt="Logo"
            width={50}
          />
        ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            onClick={() => {
              setCurrentPartner(record);
              setIsModalOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            danger
            onClick={async () => {
              try {
                await axios.delete(
                  `http://localhost:5000/award/partner/delete/partner/${record.id}`
                );
                message.success("Deleted successfully!");
                fetchPartners();
              } catch {
                message.error("Failed to delete.");
              }
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => {
          setCurrentPartner(null);
          setIsModalOpen(true);
        }}
      >
        Add Partner And Award
      </Button>
      <Table
        dataSource={partners}
        columns={columns}
        rowKey="id"
        loading={loading}
      />
      <Modal
        title={currentPartner ? "Edit Partner" : "Add Partner"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Select
          style={{ width: "100%", marginBottom: "1rem" }}
          value={uploadType}
          onChange={(value) => setUploadType(value)}
        >
          <Select.Option value="image">Image</Select.Option>
          <Select.Option value="logo">Logo</Select.Option>
        </Select>
        <Upload
          beforeUpload={(file) => {
            setFile(file);
            return false;
          }}
        >
          <Button>Select File</Button>
        </Upload>
        <div style={{ marginTop: "1rem" }}>
          <Button
            type="primary"
            onClick={handleUpload}
            disabled={!file || !uploadType}
          >
            Upload {uploadType === "image" ? "Image" : "Logo"}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default PartnersManagement;
