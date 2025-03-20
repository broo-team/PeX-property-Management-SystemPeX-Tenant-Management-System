import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import axios from "axios";

const Utility = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [utilityRates, setUtilityRates] = useState(null);

  // Fetch current utility rates on component mount.
  const fetchUtilityRates = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/utilities/utility_rates");
      setUtilityRates(response.data);
    } catch (error) {
      message.error("Failed to fetch utility rates");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchUtilityRates();
  }, []);

  // When adding or updating, call the API.
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // In this example, we simply create a new utility rate record.
      // (In a production system you might update the existing one.)
      await axios.post("http://localhost:5000/api/utilities/utility_rates", values);
      message.success("Utility rates saved successfully!");
      setIsModalVisible(false);
      form.resetFields();
      fetchUtilityRates();
    } catch (error) {
      message.error("Failed to save utility rates");
      console.error(error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  // For demonstration, we show the current utility rate record in a table.
  const columns = [
    {
      title: "Electricity Rate (Birr/kWh)",
      dataIndex: "electricity_rate",
      key: "electricity_rate",
    },
    {
      title: "Water Rate (Birr/liter)",
      dataIndex: "water_rate",
      key: "water_rate",
    },
    {
      title: "Generator Rate (Birr/hour)",
      dataIndex: "generator_rate",
      key: "generator_rate",
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h2>Utility Rates</h2>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
        Set Utility Rates
      </Button>
      
      {utilityRates ? (
        <Table columns={columns} dataSource={[utilityRates]} rowKey="id" style={{ marginTop: 20 }} />
      ) : (
        <p>No utility rates set. Please add one.</p>
      )}

      <Modal
        title="Set Utility Rates"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="electricity_rate"
            label="Electricity Rate (Birr/kWh)"
            rules={[{ required: true, message: "Please enter electricity rate" }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            name="water_rate"
            label="Water Rate (Birr/liter)"
            rules={[{ required: true, message: "Please enter water rate" }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            name="generator_rate"
            label="Generator Rate (Birr/hour)"
            rules={[{ required: true, message: "Please enter generator rate" }]}
          >
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Utility;
