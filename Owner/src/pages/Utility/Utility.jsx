import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import axios from "axios";
import { useAuth } from "../../context/AuthContext"; // update the path as needed

const Utility = () => {
  const { account } = useAuth();
  // Assumes the account object contains the building id under "building_id"
  const buildingId = account?.building_id;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [utilityRates, setUtilityRates] = useState(null);

  // Fetch utility rates when the building ID becomes available or changes
  useEffect(() => {
    if (buildingId) {
      fetchUtilityRates(buildingId);
    }
  }, [buildingId]);

  const fetchUtilityRates = async (id) => {
    try {
      const response = await axios.get("http://localhost:5000/api/utilities/utility_rates", {
        params: { building_id: id }
      });
      setUtilityRates(response.data);
    } catch (error) {
      message.error("Failed to fetch utility rates");
      console.error(error);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await axios.post("http://localhost:5000/api/utilities/utility_rates", {
         ...values,
         building_id: buildingId  // ensure the payload includes the building_id from context
      });
      message.success("Utility rates saved successfully!");
      setIsModalVisible(false);
      form.resetFields();
      fetchUtilityRates(buildingId);
    } catch (error) {
      message.error("Failed to save utility rates");
      console.error(error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const columns = [
    {
      title: "Building ID",
      dataIndex: "building_id",
      key: "building_id"
    },
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
      <h2>Utility Rates for Building: {buildingId}</h2>
      
      <Button 
        type="primary" 
        icon={<PlusOutlined />} 
        onClick={() => setIsModalVisible(true)}
        disabled={!buildingId}  // disable if building id not available
      >
        Set Utility Rates
      </Button>

      {utilityRates ? (
        <Table 
          columns={columns} 
          dataSource={[utilityRates]} 
          rowKey="id" 
          style={{ marginTop: 20 }} 
        />
      ) : (
        <p style={{ marginTop: 20 }}>
          {buildingId ? "No utility rates set for this building" : "Loading building information..."}
        </p>
      )}

      <Modal
        title="Set Utility Rates"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical">
          {/* 
            You no longer need the building selection.
            The building_id is set automatically from the context.
            The following hidden field is kept to pass the value with the form
          */}
          <Form.Item
            name="building_id"
            initialValue={buildingId}
            hidden
          >
            <Input type="hidden" />
          </Form.Item>

          <Form.Item
            name="electricity_rate"
            label="Electricity Rate (Birr/kWh)"
            rules={[{ required: true, message: "Please enter the electricity rate" }]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="water_rate"
            label="Water Rate (Birr/liter)"
            rules={[{ required: true, message: "Please enter the water rate" }]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="generator_rate"
            label="Generator Rate (Birr/hour)"
            rules={[{ required: true, message: "Please enter the generator rate" }]}
          >
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Utility;
