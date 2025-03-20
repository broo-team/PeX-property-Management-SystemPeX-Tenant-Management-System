import React, { useState, useEffect } from 'react';
import { Table, Button, message, Modal, Form, Input, InputNumber } from 'antd';
import axios from 'axios';
import { BACKENDURL } from '../../../helper/Urls';
import { FormatDateTime } from '../../../helper/FormatDate';

const InventoryTable = ({inventoryData,loading,reload}) => {
  const [loadEdit, setLoadEdit] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState(''); // State for search input

  // Handle edit button click
  const editInventory = (record) => {
    setCurrentItem(record);
    form.setFieldsValue({
      name: record.name,
      quantity: record.quantity,
      price: record.price,
      description: record.description,
    });
    setEditModalVisible(true);
  };

  // Handle form submission for editing
  const handleEditSubmit = async (values) => {
    setLoadEdit(true)
    try {
      await axios.put(`${BACKENDURL}/inventory/edit/${currentItem.id}`, values);
    setLoadEdit(false)
    message.success('Inventory item updated successfully!');
      reload()
      setEditModalVisible(false);
    } catch (error) {
    setLoadEdit(false)
    message.error('Failed to update inventory item');
    }
  };

  // Define table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Register Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render:r=>FormatDateTime(r)
    },
    {
      title: 'Action',
      key: 'action',
      render: (text, record) => (
        <>
          <Button onClick={() => editInventory(record)} style={{ marginRight: 8 }}>
            Edit
          </Button>
        </>
      ),
    },
  ];

  return (
    <>
      <Table
        dataSource={inventoryData}
        columns={columns}
        loading={loading}
        rowKey="id"
      />
      <Modal
        title="Edit Inventory Item"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
          style={{width:'100%',display:'flex',flexWrap:'wrap',justifyContent:"space-between"}}
          initialValues={currentItem}
        >
          <Form.Item
            name="name"
            label="Name"
            style={{margin:'5px 0',width:'100%'}}
            rules={[{ required: true, message: 'Please input the name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            style={{margin:'5px 0',width:'50%'}}
            name="quantity"
            label="Quantity"
            rules={[{ required: true,type:'number', message: 'Please input the quantity!' }]}
          >
            <Input  min={0} />
          </Form.Item>
          <Form.Item
            name="price"
            style={{margin:'5px 0',width:'48%'}}
            label="Price"
            rules={[{ required: true,type:'number', message: 'Please input the price!' }]}
          >
            <Input min={0} step={0.01} />
          </Form.Item>
          <Form.Item 
            style={{margin:'5px 0',width:'100%'}}
          name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item>
            <Button disabled={loadEdit} loading={loadEdit} type="primary" htmlType="submit">
              Save
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default InventoryTable;