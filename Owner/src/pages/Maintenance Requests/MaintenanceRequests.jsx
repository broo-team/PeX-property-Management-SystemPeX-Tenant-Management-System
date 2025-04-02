import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Space,
  message,
  Tag,
  InputNumber,
} from 'antd';
import dayjs from 'dayjs';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; // Adjust the path as needed

const { Option } = Select;

const MaintenanceRequests = () => {
  const { role } = useAuth();

  const [form] = Form.useForm();
  const [requests, setRequests] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [filters, setFilters] = useState({
    tenantName: '',
    status: '',
    createdAt: null,
  });
  const [actionModal, setActionModal] = useState({
    visible: false,
    type: '',
    requestId: null,
  });
  const [actionInput, setActionInput] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailRequest, setDetailRequest] = useState(null);

  const fetchRequests = async () => {
    try {
      const url = 'http://localhost:5000/api/maintenance';
      const params = {};
      if (filters.tenantName) params.tenantName = filters.tenantName;
      if (filters.status) params.status = filters.status;
      if (filters.createdAt) params.createdAt = dayjs(filters.createdAt).format('YYYY-MM-DD');
      const response = await axios.get(url, { params });
      setRequests(response.data);
    } catch (error) {
      message.error('Failed to fetch maintenance requests');
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filters]);

  // Include Tenant Approved status in the filtering.
  const visibleRequests = useMemo(() => {
    const baseStatuses = [
      'Submitted',
      'Finance Confirmed',
      'Owner Approved',
      'Owner Pending',
      'Owner Rejected',
      'Maintenance Scheduled',
      'Tenant Approved',
      'Resolved',
    ];
    if (role === 'finance' || role === 'owner' || role === 'tenant') {
      return requests.filter(r => baseStatuses.includes(r.status));
    } else if (role === 'maintenance') {
      return requests.filter(r =>
        ['Owner Approved', 'Maintenance Scheduled', 'Tenant Approved', 'Resolved'].includes(r.status)
      );
    }
    return requests;
  }, [requests, role]);

  const baseColumns = [
    {
      title: 'Tenant Name',
      dataIndex: 'full_name', // From tenant join
      key: 'full_name',
      ellipsis: true,
      width: 150,
    },
    {
      title: 'Room',
      dataIndex: 'roomName', // From joined rooms table via tenants (alias as roomName)
      key: 'roomName',
      ellipsis: true,
      width: 100,
    },
    {
      title: 'Stall Code',
      dataIndex: 'stallCode',
      key: 'stallCode',
      ellipsis: true,
      width: 100,
    },
    {
      title: 'Building ID',
      dataIndex: 'building_id',
      key: 'building_id',
      ellipsis: true,
      width: 100,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      ellipsis: true,
      width: 120,
      render: (text) => dayjs(text).format('YYYY-MM-DD'),
    },
    {
      title: 'Scheduled Date',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      ellipsis: true,
      width: 120,
      render: (date) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
  ];

  if (role !== 'maintenance') {
    baseColumns.push({
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      ellipsis: true,
      width: 80,
      render: (price) => (price ? `$${price}` : '-'),
    });
  }

  baseColumns.push({
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    ellipsis: true,
    width: 150,
    render: (status, record) => {
      let color = 'default';
      switch (status) {
        case 'Submitted':           color = 'gray'; break;
        case 'Finance Confirmed':     color = 'orange'; break;
        case 'Owner Approved':        color = 'blue'; break;
        case 'Owner Pending':         color = 'gold'; break;
        case 'Owner Rejected':        color = 'red'; break;
        case 'Maintenance Scheduled': color = 'purple'; break;
        case 'Tenant Approved':       color = 'cyan'; break;
        case 'Resolved':              color = 'green'; break;
        default: break;
      }
      return (
        <div>
          <Tag color={color} style={{ marginBottom: 2 }}>
            {status}
          </Tag>
          {(['Owner Pending', 'Owner Rejected'].includes(status) && record.reason) && (
            <div style={{ fontSize: '12px', color: '#555' }}>
              Reason: {record.reason}
            </div>
          )}
        </div>
      );
    },
  });

  baseColumns.push({
    title: 'Tenant Approval',
    dataIndex: 'tenantApproved', // Boolean from backend.
    key: 'tenantApproved',
    ellipsis: true,
    width: 120,
    render: (approved) =>
      approved ? <Tag color="blue">Approved</Tag> : <Tag color="volcano">Not Approved</Tag>,
  });

  baseColumns.push({
    title: 'Actions',
    key: 'actions',
    width: 300,
    render: (_, record) => {
      const actions = [];
      actions.push(
        <Button
          type="link"
          key="view-details"
          onClick={() => openDetailModal(record)}
        >
          View Details
        </Button>
      );
      if (role === 'finance') {
        if (['Submitted', 'Owner Pending'].includes(record.status)) {
          actions.push(
            <Button
              type="link"
              key="finance-confirm"
              onClick={() => openActionModal('financeConfirm', record.id)}
            >
              Set Cost
            </Button>
          );
        } else if (record.status === 'Finance Confirmed') {
          actions.push(
            <span
              key="finance-confirmed"
              style={{ color: 'green', fontWeight: 'bold' }}
            >
              Confirmed
            </span>
          );
        }
      } else if (role === 'owner') {
        if (['Finance Confirmed', 'Owner Pending'].includes(record.status)) {
          actions.push(
            <Button
              type="link"
              key="owner-approve"
              onClick={() => handleOwnerApprove(record.id)}
            >
              Approve
            </Button>,
            <Button
              type="link"
              key="owner-pending"
              onClick={() => openActionModal('ownerPending', record.id)}
            >
              Set Pending
            </Button>,
            <Button
              type="link"
              danger
              key="owner-reject"
              onClick={() => openActionModal('ownerReject', record.id)}
            >
              Reject
            </Button>
          );
        }
      } else if (role === 'maintenance') {
        if (record.status === 'Owner Approved') {
          actions.push(
            <Button
              type="link"
              key="maintenance-schedule"
              onClick={() => openActionModal('maintenanceSchedule', record.id)}
            >
              Schedule
            </Button>
          );
        }
        if (['Maintenance Scheduled', 'Resolved'].includes(record.status)) {
          actions.push(
            <Button
              type="link"
              key="resolve"
              onClick={() => handleResolve(record.id)}
            >
              Resolve
            </Button>
          );
        }
      } else if (role === 'tenant') {
        if (!record.tenantApproved) {
          actions.push(
            <Button
              type="link"
              key="tenant-approve"
              onClick={() => handleTenantApprove(record.id)}
            >
              Approve Resolution
            </Button>
          );
        } else {
          actions.push(
            <span
              key="tenant-approved"
              style={{ color: 'blue', fontWeight: 'bold' }}
            >
              Approved
            </span>
          );
        }
      }
      return <Space wrap>{actions}</Space>;
    },
  });

  const openDetailModal = (record) => {
    setDetailRequest(record);
    setDetailModalVisible(true);
  };

  const openActionModal = (type, id) => {
    setActionModal({ visible: true, type, requestId: id });
    setActionInput(null);
  };

  const handleOwnerApprove = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/maintenance/${id}`, {
        type: 'ownerApprove',
        payload: {},
      });
      message.success('Request approved.');
      fetchRequests();
    } catch (error) {
      message.error('Failed to approve request.');
    }
  };

  const handleTenantApprove = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/maintenance/${id}`, {
        type: 'tenantApprove',
        payload: {},
      });
      message.success('Resolution approved by tenant.');
      fetchRequests();
    } catch (error) {
      message.error('Failed to update tenant approval.');
    }
  };

  const handleActionModalOk = async () => {
    try {
      const { type, requestId } = actionModal;
      let payload = {};
      switch (type) {
        case 'financeConfirm':
          if (actionInput == null) {
            message.error('Please enter a valid price.');
            return;
          }
          payload = { price: actionInput };
          break;
        case 'ownerPending':
          if (!actionInput) {
            message.error('Please provide a reason.');
            return;
          }
          payload = { reason: actionInput };
          break;
        case 'ownerReject':
          if (!actionInput) {
            message.error('Please provide a reason.');
            return;
          }
          payload = { reason: actionInput };
          break;
        case 'maintenanceSchedule':
          if (!actionInput) {
            message.error('Please select a scheduled date.');
            return;
          }
          payload = { scheduledDate: dayjs(actionInput).format('YYYY-MM-DD') };
          break;
        case 'resolve':
          payload = {};
          break;
        default:
          return;
      }
      await axios.put(`http://localhost:5000/api/maintenance/${requestId}`, { type, payload });
      message.success(`Action ${type} completed.`);
      setActionModal({ visible: false, type: '', requestId: null });
      fetchRequests();
    } catch (error) {
      message.error('Failed to update maintenance request.');
    }
  };

  const handleResolve = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/maintenance/${id}`, {
        type: 'resolve',
        payload: {},
      });
      message.success('Maintenance request resolved!');
      fetchRequests();
    } catch (error) {
      message.error('Failed to resolve maintenance request.');
    }
  };

  const openModalForAdd = () => {
    form.resetFields();
    setEditingRequest(null);
    setIsModalVisible(true);
  };

  const openModalForEdit = (record) => {
    form.setFieldsValue({
      tenant_id: record.tenant_id,
      stallCode: record.stallCode,
      building_id: record.building_id,
      issueDescription: record.issueDescription,
    });
    setEditingRequest(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/maintenance/${id}`);
      message.success('Maintenance request deleted successfully!');
      fetchRequests();
    } catch (error) {
      message.error('Failed to delete maintenance request.');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingRequest) {
        await axios.put(`http://localhost:5000/api/maintenance/${editingRequest.id}`, {
          type: 'edit',
          payload: values,
        });
        message.success('Maintenance request updated successfully!');
      } else {
        await axios.post('http://localhost:5000/api/maintenance', values);
        message.success('Maintenance request added successfully!');
      }
      setIsModalVisible(false);
      fetchRequests();
    } catch (error) {
      message.error('Failed to submit maintenance request.');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const handleTenantSearch = (e) =>
    setFilters((prev) => ({ ...prev, tenantName: e.target.value }));
  const handleStatusFilter = (value) =>
    setFilters((prev) => ({ ...prev, status: value }));
  const handleDateFilter = (date) =>
    setFilters((prev) => ({ ...prev, createdAt: date }));

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search by Tenant Name"
          value={filters.tenantName}
          onChange={handleTenantSearch}
        />
        <Select
          placeholder="Filter by Status"
          value={filters.status}
          onChange={handleStatusFilter}
          allowClear
          style={{ width: 180 }}
        >
          <Option value="Submitted">Submitted</Option>
          <Option value="Finance Confirmed">Finance Confirmed</Option>
          <Option value="Owner Approved">Owner Approved</Option>
          <Option value="Owner Pending">Owner Pending</Option>
          <Option value="Owner Rejected">Owner Rejected</Option>
          <Option value="Maintenance Scheduled">Maintenance Scheduled</Option>
          <Option value="Tenant Approved">Tenant Approved</Option>
          <Option value="Resolved">Resolved</Option>
        </Select>
        <DatePicker
          placeholder="Filter by Created Date"
          value={filters.createdAt}
          onChange={handleDateFilter}
        />
      </Space>
      <Table
        columns={baseColumns}
        dataSource={visibleRequests}
        rowKey="id"
        size="small"
        scroll={{ x: 800 }}
      />
      <Modal
        title={
          actionModal.type === 'financeConfirm'
            ? 'Finance Confirmation'
            : actionModal.type === 'ownerPending'
            ? 'Set Pending (Enter Reason)'
            : actionModal.type === 'ownerReject'
            ? 'Owner Rejection (Enter Reason)'
            : actionModal.type === 'maintenanceSchedule'
            ? 'Set Maintenance Schedule'
            : ''
        }
        visible={actionModal.visible}
        onOk={handleActionModalOk}
        onCancel={() => setActionModal((prev) => ({ ...prev, visible: false }))}
        width={450}
      >
        {actionModal.type === 'financeConfirm' && (
          <div>
            <label>Enter Cost:</label>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              onChange={(value) => setActionInput(value)}
              value={actionInput}
            />
          </div>
        )}
        {(actionModal.type === 'ownerPending' || actionModal.type === 'ownerReject') && (
          <div>
            <label>Enter Reason:</label>
            <Input.TextArea
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
              placeholder="Provide reason"
            />
          </div>
        )}
        {actionModal.type === 'maintenanceSchedule' && (
          <div>
            <label>Select Scheduled Date:</label>
            <DatePicker
              style={{ width: '100%' }}
              onChange={(date) => setActionInput(date)}
              value={actionInput}
            />
          </div>
        )}
      </Modal>

      <Modal
        title="Maintenance Request Details"
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {detailRequest && (
          <div>
            <p>
              <strong>Tenant Name:</strong> {detailRequest.full_name || '-'}
            </p>
            <p>
              <strong>Room:</strong> {detailRequest.roomName || '-'}
            </p>
            <p>
              <strong>Stall Code:</strong> {detailRequest.stallCode}
            </p>
            <p>
              <strong>Building ID:</strong> {detailRequest.building_id}
            </p>
            <p>
              <strong>Issue Description:</strong> {detailRequest.issueDescription}
            </p>
            {role !== 'maintenance' && (
              <p>
                <strong>Price:</strong> {detailRequest.price ? `$${detailRequest.price}` : '-'}
              </p>
            )}
            <p>
              <strong>Status:</strong> {detailRequest.status}
            </p>
            <p>
              <strong>Tenant Approval:</strong>{' '}
              {detailRequest.tenantApproved ? (
                <Tag color="blue">Approved</Tag>
              ) : (
                <Tag color="volcano">Not Approved</Tag>
              )}
            </p>
            {detailRequest.reason && (
              <p>
                <strong>Reason:</strong> {detailRequest.reason}
              </p>
            )}
            <p>
              <strong>Created At:</strong> {dayjs(detailRequest.createdAt).format('YYYY-MM-DD')}
            </p>
            <p>
              <strong>Scheduled Date:</strong>{' '}
              {detailRequest.scheduledDate ? dayjs(detailRequest.scheduledDate).format('YYYY-MM-DD') : '-'}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MaintenanceRequests;
