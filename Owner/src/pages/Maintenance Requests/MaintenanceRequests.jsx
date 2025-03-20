import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Select, Space, message, Tag } from 'antd';
import dayjs from 'dayjs'; // For date handling

const { RangePicker } = DatePicker;
const { Option } = Select;

const MaintenanceRequests = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [requests, setRequests] = useState([]);
  const [editingRequest, setEditingRequest] = useState(null);
  const [filteredRequests, setFilteredRequests] = useState([]);

  const columns = [
    {
      title: 'Tenant Name',
      dataIndex: 'tenantName',
      key: 'tenantName',
    },
    {
      title: 'Stall Code',
      dataIndex: 'stallCode',
      key: 'stallCode',
    },
    {
      title: 'Issue Description',
      dataIndex: 'issueDescription',
      key: 'issueDescription',
    },
    {
      title: 'Request Date',
      dataIndex: 'requestDate',
      key: 'requestDate',
      render: (_, record) => dayjs(record.requestDate).format('YYYY-MM-DD'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Pending' ? 'orange' : status === 'Confirmed' ? 'blue' : 'green'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          {record.status === 'Pending' && (
            <Button type="link" onClick={() => handleConfirm(record.key)}>Confirm</Button>
          )}
          {record.status === 'Confirmed' && (
            <Button type="link" onClick={() => handleResolve(record.key)}>Resolve</Button>
          )}
          <Button type="link" onClick={() => handleEdit(record)}>Edit</Button>
          <Button type="link" danger onClick={() => handleDelete(record.key)}>Delete</Button>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    form.resetFields();
    setEditingRequest(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    form.setFieldsValue({
      ...record,
      requestDate: dayjs(record.requestDate),
    });
    setEditingRequest(record);
    setIsModalVisible(true);
  };

  const handleDelete = (key) => {
    setRequests(requests.filter((request) => request.key !== key));
    message.success('Maintenance request deleted successfully!');
  };

  const handleConfirm = (key) => {
    setRequests(requests.map((request) => (request.key === key ? { ...request, status: 'Confirmed' } : request)));
    message.success('Maintenance request confirmed!');
  };

  const handleResolve = (key) => {
    setRequests(requests.map((request) => (request.key === key ? { ...request, status: 'Resolved' } : request)));
    message.success('Maintenance request resolved!');
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      const requestData = {
        ...values,
        requestDate: values.requestDate.format('YYYY-MM-DD'),
        status: 'Pending', // Default status for new requests
        key: editingRequest ? editingRequest.key : Date.now(),
      };

      if (editingRequest) {
        // Update existing request
        setRequests(requests.map((request) => (request.key === editingRequest.key ? requestData : request)));
        message.success('Maintenance request updated successfully!');
      } else {
        // Add new request
        setRequests([...requests, requestData]);
        message.success('Maintenance request added successfully!');
      }
      setIsModalVisible(false);
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleSearch = (filters) => {
    const filtered = requests.filter((request) => {
      const matchesTenant = filters.tenantName ? request.tenantName.includes(filters.tenantName) : true;
      const matchesStatus = filters.status ? request.status === filters.status : true;
      const matchesDate = filters.requestDate ? dayjs(request.requestDate).isSame(filters.requestDate, 'day') : true;
      return matchesTenant && matchesStatus && matchesDate;
    });
    setFilteredRequests(filtered);
  };

  return (
    <div>
      <Button type="primary" onClick={handleAdd} style={{ marginBottom: 16 }}>
        Add Maintenance Request
      </Button>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search by Tenant Name"
          onChange={(e) => handleSearch({ tenantName: e.target.value })}
        />
        <Select
          placeholder="Filter by Status"
          onChange={(value) => handleSearch({ status: value })}
          allowClear
        >
          <Option value="Pending">Pending</Option>
          <Option value="Confirmed">Confirmed</Option>
          <Option value="Resolved">Resolved</Option>
        </Select>
        <DatePicker
          placeholder="Filter by Request Date"
          onChange={(date) => handleSearch({ requestDate: date })}
        />
      </Space>
      <Table columns={columns} dataSource={filteredRequests.length > 0 ? filteredRequests : requests} />

      <Modal
        title={editingRequest ? 'Edit Maintenance Request' : 'Add Maintenance Request'}
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="tenantName"
            label="Tenant Name"
            rules={[{ required: true, message: 'Please enter the tenant name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="stallCode"
            label="Stall Code"
            rules={[{ required: true, message: 'Please enter the stall code!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="issueDescription"
            label="Issue Description"
            rules={[{ required: true, message: 'Please describe the issue!' }]}
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            name="requestDate"
            label="Request Date"
            rules={[{ required: true, message: 'Please select the request date!' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MaintenanceRequests;