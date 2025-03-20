import React, { useState } from 'react';
import { Form, Input, InputNumber, Button } from 'antd';
import axios from 'axios';
import { BACKENDURL } from '../../../helper/Urls';

const NewInventoryForm = ({ reload, openModalFun }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await axios.post(`${BACKENDURL}/inventory/create`, values);
      reload(); // Fetch updated inventory data
      openModalFun(false); // Close the modal
      form.resetFields(); // Reset form fields
    } catch (error) {
      console.error('Error creating inventory:', error);
    }
    setLoading(false);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      autoComplete="off"
    >
      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: 'Please input the inventory name!' }]}
      >
        <Input placeholder="Enter inventory name" />
      </Form.Item>

      <Form.Item
        label="Description"
        name="description"
        rules={[{ required: true, message: 'Please input the inventory description!' }]}
      >
        <Input.TextArea rows={4} placeholder="Enter inventory description" />
      </Form.Item>

      <Form.Item
        label="Quantity"
        name="quantity"
        rules={[{ required: true, message: 'Please input the quantity!' }]}
      >
        <InputNumber min={1} placeholder="Enter quantity" style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        label="Price"
        name="price"
        rules={[{ required: true, message: 'Please input the price!' }]}
      >
        <InputNumber min={0.01} step={0.01} placeholder="Enter price" style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default NewInventoryForm;