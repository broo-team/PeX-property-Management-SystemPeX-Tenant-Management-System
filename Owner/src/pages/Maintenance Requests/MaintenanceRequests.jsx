import React, { useState, useMemo } from 'react';
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

const { Option } = Select;

const MaintenanceRequests = () => {
  const [form] = Form.useForm();
  // List of maintenance requests
  const [requests, setRequests] = useState([]);
  // For add/edit modal (tenant submission)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);

  // For filtering the list
  const [filters, setFilters] = useState({
    tenantName: '',
    status: '',
    requestDate: null,
  });

  // Reusable Action Modal for various role actions (finance, owner, maintenance)
  // actionModal has type (defines what the modal does) and requestKey to identify the request.
  // actionInput holds either the price (number), scheduled date (date object), or reason (string) as needed.
  const [actionModal, setActionModal] = useState({
    visible: false,
    type: "", // one of: financeConfirm, ownerApprove, ownerPending, ownerReject, maintenanceSchedule
    requestKey: null,
  });
  const [actionInput, setActionInput] = useState(null);

  // Compute filtered results based on filters
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const tenantMatch = filters.tenantName
        ? request.tenantName.toLowerCase().includes(filters.tenantName.toLowerCase())
        : true;
      const statusMatch = filters.status ? request.status === filters.status : true;
      const dateMatch = filters.requestDate
        ? dayjs(request.requestDate).isSame(filters.requestDate, 'day')
        : true;
      return tenantMatch && statusMatch && dateMatch;
    });
  }, [requests, filters]);

  // Table columns with dynamic actions based on request status.
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
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => (price ? `$${price}` : '-'),
    },
    {
      title: 'Scheduled Date',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      render: (date) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        let color = 'default';
        switch (status) {
          case 'Submitted':
            color = 'gray';
            break;
          case 'Finance Confirmed':
            color = 'orange';
            break;
          case 'Owner Approved':
            color = 'blue';
            break;
          case 'Owner Pending':
            color = 'gold';
            break;
          case 'Owner Rejected':
            color = 'red';
            break;
          case 'Maintenance Scheduled':
            color = 'purple';
            break;
          case 'Resolved':
            color = 'green';
            break;
          default:
            break;
        }
        return (
          <Tag color={color}>
            {status}
            {record.scheduledDate ? ` (Scheduled: ${dayjs(record.scheduledDate).format('YYYY-MM-DD')})` : ''}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const actions = [];
        // Based on the current status, show the appropriate action buttons.
        if (record.status === 'Submitted') {
          // Finance needs to confirm this submission with a price.
          actions.push(
            <Button type="link" onClick={() => openActionModal('financeConfirm', record.key)}>
              Finance Confirm
            </Button>
          );
        }
        if (record.status === 'Finance Confirmed') {
          // Owner decisions: Approve, Pending, or Reject.
          actions.push(
            <Button type="link" onClick={() => openActionModal('ownerApprove', record.key)}>
              Owner Approve
            </Button>,
            <Button type="link" onClick={() => openActionModal('ownerPending', record.key)}>
              Owner Pending
            </Button>,
            <Button type="link" danger onClick={() => openActionModal('ownerReject', record.key)}>
              Owner Reject
            </Button>
          );
        }
        if (record.status === 'Owner Approved') {
          // Maintenance: schedule the resolution date.
          actions.push(
            <Button type="link" onClick={() => openActionModal('maintenanceSchedule', record.key)}>
              Schedule
            </Button>
          );
        }
        if (record.status === 'Maintenance Scheduled') {
          // Maintenance resolves the issue.
          actions.push(
            <Button type="link" onClick={() => handleResolve(record.key)}>
              Resolve
            </Button>
          );
        }
        // Common actions: Edit and Delete.
        actions.push(
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>,
          <Button type="link" danger onClick={() => handleDelete(record.key)}>
            Delete
          </Button>
        );
        return <Space size="middle">{actions}</Space>;
      },
    },
  ];

  // Opens the action modal for a given action type and request.
  const openActionModal = (type, requestKey) => {
    setActionModal({ visible: true, type, requestKey });
    setActionInput(null);
  };

  // Handles OK click from the action modal.
  const handleActionModalOk = () => {
    const { type, requestKey } = actionModal;

    setRequests(prevRequests =>
      prevRequests.map(request => {
        if (request.key === requestKey) {
          switch (type) {
            case 'financeConfirm':
              if (actionInput === null || actionInput === undefined) {
                message.error('Please enter a valid price.');
                return request;
              }
              return { ...request, price: actionInput, status: 'Finance Confirmed' };
            case 'ownerApprove':
              return { ...request, status: 'Owner Approved' };
            case 'ownerPending':
              if (!actionInput) {
                message.error('Please provide a reason.');
                return request;
              }
              return { ...request, status: 'Owner Pending', reason: actionInput };
            case 'ownerReject':
              if (!actionInput) {
                message.error('Please provide a reason.');
                return request;
              }
              return { ...request, status: 'Owner Rejected', reason: actionInput };
            case 'maintenanceSchedule':
              if (!actionInput) {
                message.error('Please select a scheduled date.');
                return request;
              }
              return {
                ...request,
                scheduledDate: dayjs(actionInput).format('YYYY-MM-DD'),
                status: 'Maintenance Scheduled'
              };
            default:
              return request;
          }
        }
        return request;
      })
    );

    // Display a message based on action type.
    if (type === 'financeConfirm') {
      message.success('Finance confirmed the issue with price.');
    } else if (type === 'ownerApprove') {
      message.success('Owner approved the issue.');
    } else if (type === 'ownerPending') {
      message.success('Owner set the issue as pending.');
    } else if (type === 'ownerReject') {
      message.success('Owner rejected the issue.');
    } else if (type === 'maintenanceSchedule') {
      message.success('Maintenance scheduled a date.');
    }

    // Close action modal.
    setActionModal(prev => ({ ...prev, visible: false }));
  };

  // Directly resolves a request if maintenance has scheduled it.
  const handleResolve = (key) => {
    setRequests(prevRequests =>
      prevRequests.map(request =>
        request.key === key ? { ...request, status: 'Resolved' } : request
      )
    );
    message.success('Maintenance request resolved!');
  };

  // Opens the tenant submission modal.
  const openModalForAdd = () => {
    form.resetFields();
    setEditingRequest(null);
    setIsModalVisible(true);
  };

  // Prepares the form for editing a request.
  const handleEdit = (record) => {
    // For editing, we pre-fill the form. Notice that price is not included in tenant submission.
    form.setFieldsValue({
      ...record,
      requestDate: dayjs(record.requestDate),
    });
    setEditingRequest(record);
    setIsModalVisible(true);
  };

  // Deletes a request.
  const handleDelete = (key) => {
    setRequests(prev => prev.filter(request => request.key !== key));
    message.success('Maintenance request deleted successfully!');
  };

  // Handle form OK for adding/editing (tenant submission)
  // New requests will have status "Submitted"
  const handleModalOk = () => {
    form.validateFields().then(values => {
      const requestData = {
        ...values,
        requestDate: dayjs(values.requestDate).format('YYYY-MM-DD'),
        status: editingRequest ? editingRequest.status : 'Submitted',
        key: editingRequest ? editingRequest.key : Date.now(), // For production, consider using a UUID library.
      };

      if (editingRequest) {
        setRequests(prev =>
          prev.map(request =>
            request.key === editingRequest.key ? requestData : request
          )
        );
        message.success('Maintenance request updated successfully!');
      } else {
        setRequests(prev => [...prev, requestData]);
        message.success('Maintenance request added successfully!');
      }
      setIsModalVisible(false);
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  // Filter handlers.
  const handleTenantSearch = (e) =>
    setFilters(prev => ({ ...prev, tenantName: e.target.value }));
  const handleStatusFilter = (value) =>
    setFilters(prev => ({ ...prev, status: value }));
  const handleDateFilter = (date) =>
    setFilters(prev => ({ ...prev, requestDate: date }));

  return (
    <div>
      <Button type="primary" onClick={openModalForAdd} style={{ marginBottom: 16 }}>
        Add Maintenance Request
      </Button>
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
          style={{ width: 160 }}
        >
          <Option value="Submitted">Submitted</Option>
          <Option value="Finance Confirmed">Finance Confirmed</Option>
          <Option value="Owner Approved">Owner Approved</Option>
          <Option value="Owner Pending">Owner Pending</Option>
          <Option value="Owner Rejected">Owner Rejected</Option>
          <Option value="Maintenance Scheduled">Maintenance Scheduled</Option>
          <Option value="Resolved">Resolved</Option>
        </Select>
        <DatePicker
          placeholder="Filter by Request Date"
          value={filters.requestDate}
          onChange={handleDateFilter}
        />
      </Space>
      <Table columns={columns} dataSource={filteredRequests} rowKey="key" />

      {/* Tenant Add/Edit Modal (for submission) */}
      <Modal
        title={editingRequest ? 'Edit Maintenance Request' : 'Add Maintenance Request'}
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
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

      {/* Generic Action Modal for Finance, Owner, and Maintenance actions */}
      <Modal
        title={
          actionModal.type === 'financeConfirm'
            ? 'Finance Confirmation'
            : actionModal.type === 'ownerApprove'
            ? 'Owner Approval'
            : actionModal.type === 'ownerPending'
            ? 'Owner Pending'
            : actionModal.type === 'ownerReject'
            ? 'Owner Rejection'
            : actionModal.type === 'maintenanceSchedule'
            ? 'Set Maintenance Schedule'
            : ''
        }
        visible={actionModal.visible}
        onOk={handleActionModalOk}
        onCancel={() => setActionModal(prev => ({ ...prev, visible: false }))}
      >
        {actionModal.type === 'financeConfirm' && (
          <div>
            <label>Enter Price:</label>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              onChange={(value) => setActionInput(value)}
              value={actionInput}
            />
          </div>
        )}
        {actionModal.type === 'ownerApprove' && (
          <div>
            <p>Click OK to approve the request.</p>
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
    </div>
  );
};

export default MaintenanceRequests;
