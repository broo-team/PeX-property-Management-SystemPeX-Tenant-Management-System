import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'; // Import useRef
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

// Base API URL.
const API_BASE = 'http://localhost:5000/api/maintenance'; // Base URL for maintenance endpoint

const MaintenanceRequests = () => {
  // Get role, buildingId, and authLoading from auth context
  const { role, buildingId, authLoading } = useAuth();

  const [form] = Form.useForm();
  // State to hold ALL fetched requests
  const [allRequests, setAllRequests] = useState([]);
  // State for requests filtered by buildingId, status, search, and role for display
  const [displayRequests, setDisplayRequests] = useState([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  // Keep filters state for search/status/date input values
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

  // Ref to track if we've already attempted to fetch all requests
  const fetchedAllRequests = useRef(false);


  // Fetch ALL maintenance requests from the backend.
  // Use useCallback to memoize the function as it's a dependency.
  const fetchAllRequests = useCallback(async () => {
    // Prevent fetching if already fetched or auth is loading
    if (fetchedAllRequests.current || authLoading) {
      console.log("Skipping fetchAllRequests: Already fetched or auth loading");
      return;
    }
    // Mark as fetched to prevent immediate refetch on subsequent renders
    fetchedAllRequests.current = true;

    try {
      console.log("Fetching ALL maintenance requests...");
      // Fetch ALL requests without any filtering parameters
      const response = await axios.get(API_BASE);
      console.log("Fetched ALL maintenance requests:", response.data);
      setAllRequests(response.data || []); // Store all requests

    } catch (error) {
      message.error('Failed to fetch maintenance requests');
      console.error(error);
      setAllRequests([]); // Clear requests on error
    }
  }, [authLoading]); // Dependency on authLoading to ensure fetch happens after auth loads


  // Effect to trigger fetching ALL requests when component mounts or auth state changes
  useEffect(() => {
    // Only fetch if auth is loaded
    if (!authLoading) {
      fetchAllRequests(); // Call the memoized fetch function
    }
    // No need to add buildingId here, as fetchAllRequests doesn't depend on it.
    // Filtering happens in the next effect.
}, [authLoading, fetchAllRequests]);


  // Filter and process data for display when allRequests, buildingId, filters, or role changes.
  useEffect(() => {
    let filtered = allRequests;

    // 1. Filter by buildingId
    if (buildingId) {
        console.log(`Filtering by buildingId: ${buildingId}`);
        filtered = filtered.filter(request => Number(request.building_id) === buildingId);
        console.log("After buildingId filter:", filtered);
    } else {
        // If buildingId is not available, show nothing
        console.log("Building ID not available, clearing display data.");
        setDisplayRequests([]);
        return;
    }

    // 2. Filter by search/status/date filters
    console.log("Applying search/status/date filters:", filters);
    if (filters.tenantName) {
      filtered = filtered.filter(request =>
        request.full_name && request.full_name.toLowerCase().includes(filters.tenantName.toLowerCase())
      );
    }
    if (filters.status) {
      filtered = filtered.filter(request => request.status === filters.status);
    }
    if (filters.createdAt) {
      const filterDate = dayjs(filters.createdAt).startOf('day');
      filtered = filtered.filter(request =>
        dayjs(request.createdAt).startOf('day').isSame(filterDate, 'day')
      );
    }
    console.log("After search/status/date filters:", filtered);


    // 3. Filter by role-based status visibility (original logic)
    console.log("Applying role filter:", role);
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
      filtered = filtered.filter(r => baseStatuses.includes(r.status));
    } else if (role === 'maintenance') {
      filtered = filtered.filter(r =>
        ['Owner Approved', 'Maintenance Scheduled', 'Tenant Approved', 'Resolved'].includes(r.status)
      );
    }
    console.log("After role filter:", filtered);


    setDisplayRequests(filtered); // Set the final filtered list for display

    // Dependencies: allRequests (fetched), buildingId (from auth), filters (state), role (from auth)
}, [allRequests, buildingId, filters, role]);


  // Define table columns. Memoized as they depend on role
  const baseColumns = useMemo(() => {
      const columns = [
        {
          title: 'Tenant Name',
          dataIndex: 'full_name', // From tenant join
          key: 'full_name',
          ellipsis: true,
          width: 150,
        },
        {
          title: 'Room No',
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
          title: 'Issue Date',
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
        columns.push({
          title: 'Price',
          dataIndex: 'price',
          key: 'price',
          ellipsis: true,
          width: 80,
          render: (price) => (price ? `$${price}` : '-'),
        });
      }

      columns.push({
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        ellipsis: true,
        width: 150,
        render: (status, record) => {
          let color = 'default';
          switch (status) {
            case 'Submitted':           color = 'gray'; break;
            case 'Finance Confirmed':     color = 'orange'; break;
            case 'Owner Approved':        color = 'blue'; break;
            case 'Owner Pending':         color = 'gold'; break;
            case 'Owner Rejected':        color = 'red'; break;
            case 'Maintenance Scheduled': color = 'purple'; break;
            case 'Tenant Approved':       color = 'cyan'; break;
            case 'Resolved':              color = 'green'; break;
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

      columns.push({
        title: 'Tenant Approval',
        dataIndex: 'tenantApproved', // Boolean from backend.
        key: 'tenantApproved',
        ellipsis: true,
        width: 120,
        render: (approved) =>
          approved ? <Tag color="blue">Approved</Tag> : <Tag color="volcano">Not Approved</Tag>,
      });

      columns.push({
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

          // Finance actions
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
          }
          // Owner actions
          else if (role === 'owner') {
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
          }
          // Maintenance actions
          else if (role === 'maintenance') {
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
            // Allow resolve from Maintenance Scheduled state. (Resolved state might be final)
            if (record.status === 'Maintenance Scheduled') {
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
          }
          // Tenant actions
          else if (role === 'tenant') {
            // Tenant can only approve if status is Maintenance Scheduled or Resolved and they haven't approved yet
            if (!record.tenantApproved && (record.status === 'Maintenance Scheduled' || record.status === 'Resolved')) {
              actions.push(
                <Button
                  type="link"
                  key="tenant-approve"
                  onClick={() => handleTenantApprove(record.id)}
                >
                  Approve Resolution
                </Button>
              );
            } else if (record.tenantApproved) {
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
      return columns;
  }, [role]); // Columns depend on role

  const openDetailModal = (record) => {
    setDetailRequest(record);
    setDetailModalVisible(true);
  };

  const openActionModal = (type, id) => {
    setActionModal({ visible: true, type, requestId: id });
    setActionInput(null); // Reset input when opening
  };

  // Action Handlers (handleOwnerApprove, handleTenantApprove, handleActionModalOk, handleResolve, handleDelete)
  // These modify a specific request by ID. After successful actions, refetch all data.

  const handleOwnerApprove = async (id) => {
    try {
      await axios.put(`${API_BASE}/${id}`, {
        type: 'ownerApprove',
        payload: {},
      });
      message.success('Request approved.');
      fetchAllRequests(); // Refetch all data to update the list
    } catch (error) {
      message.error('Failed to approve request.');
    }
  };

  const handleTenantApprove = async (id) => {
    try {
      await axios.put(`${API_BASE}/${id}`, {
        type: 'tenantApprove',
        payload: {},
      });
      message.success('Resolution approved by tenant.');
      fetchAllRequests(); // Refetch all data to update the list
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
          if (actionInput == null || actionInput < 0) {
            message.error('Please enter a valid price.');
            return;
          }
          payload = { price: Number(actionInput) };
          break;
        case 'ownerPending':
          if (!actionInput || typeof actionInput !== 'string' || actionInput.trim() === '') {
            message.error('Please provide a reason.');
            return;
          }
          payload = { reason: actionInput.trim() };
          break;
        case 'ownerReject':
          if (!actionInput || typeof actionInput !== 'string' || actionInput.trim() === '') {
            message.error('Please provide a reason.');
            return;
          }
          payload = { reason: actionInput.trim() };
          break;
        case 'maintenanceSchedule':
          if (!actionInput || !dayjs(actionInput).isValid()) {
            message.error('Please select a valid scheduled date.');
            return;
          }
          payload = { scheduledDate: dayjs(actionInput).format('YYYY-MM-DD') };
          break;
        case 'resolve':
          payload = {}; // Resolve action might not need extra payload
          break;
        default:
          message.error('Unknown action type.');
          return;
      }
      await axios.put(`${API_BASE}/${requestId}`, { type, payload });
      message.success(`Action completed.`);
      setActionModal({ visible: false, type: '', requestId: null });
      fetchAllRequests(); // Refetch all data to update the list
    } catch (error) {
      message.error('Failed to complete action.');
      console.error("Action failed:", error);
    }
  };

  const handleResolve = async (id) => {
    try {
      await axios.put(`${API_BASE}/${id}`, {
        type: 'resolve',
        payload: {},
      });
      message.success('Maintenance request resolved!');
      fetchAllRequests(); // Refetch all data to update the list
    } catch (error) {
      message.error('Failed to resolve maintenance request.');
      console.error(error);
    }
  };

  // Add/Edit/Delete functions - assuming these are not primary actions in this view
  // based on the original code not having buttons for them in the main table.
  // Keeping them as stubs or removing if not used.

  const openModalForAdd = () => {
    message.info("Add Maintenance Request is not available in this view.");
  };

  const openModalForEdit = (record) => {
    message.info("Edit Maintenance Request is not available in this view.");
  };

  const handleDelete = async (id) => {
    message.info("Delete Maintenance Request is not available in this view.");
    // If you need delete here, implement the API call and fetchAllRequests()
    // try {
    //   await axios.delete(`${API_BASE}/${id}`);
    //   message.success('Maintenance request deleted successfully!');
    //   fetchAllRequests();
    // } catch (error) {
    //   message.error('Failed to delete maintenance request.');
    //   console.error(error);
    // }
  };

  // This modal logic seems related to Add/Edit, which are not enabled in this code
  // Leaving it commented out or adjusting as needed.
  // const handleModalOk = async () => { ... }
  // const handleModalCancel = () => { ... }


  // Handlers for filter changes - These update the filters state, which triggers the filtering useEffect
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
        {/* Optional: Add a button to clear all filters */}
         {/* <Button onClick={() => setFilters({ tenantName: '', status: '', createdAt: null })}>Clear Filters</Button> */}
      </Space>
      {/* Table displays the filtered requests */}
      <Table
        columns={baseColumns}
        dataSource={displayRequests} // Use displayRequests for the table data source
        rowKey="id"
        size="small"
        scroll={{ x: 800 }}
      />

      {/* Action Modal for various updates */}
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
            : actionModal.type === 'resolve' // Added title for resolve action if it needs input
            ? 'Resolve Request'
            : ''
        }
        visible={actionModal.visible}
        onOk={handleActionModalOk}
        onCancel={() => setActionModal((prev) => ({ ...prev, visible: false }))}
        width={450}
      >
        {/* Input fields based on action type */}
        {actionModal.type === 'financeConfirm' && (
          <div>
            <label>Enter Cost:</label>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              onChange={(value) => setActionInput(value)}
              value={actionInput}
              placeholder="Enter price"
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
              autoSize={{ minRows: 3, maxRows: 5 }}
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
              format="YYYY-MM-DD"
            />
          </div>
        )}
         {/* Add input for resolve if needed, currently payload is empty */}
         {/* {actionModal.type === 'resolve' && ( ... )} */}
      </Modal>

      {/* Maintenance Request Details Modal */}
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
            {/* Display Finance Confirmed Date if available */}
             {detailRequest.financeConfirmedAt && (
                 <p>
                     <strong>Finance Confirmed At:</strong> {dayjs(detailRequest.financeConfirmedAt).format('YYYY-MM-DD HH:mm')}
                 </p>
             )}
             {/* Display Owner Approved Date if available */}
             {detailRequest.ownerApprovedAt && (
                 <p>
                     <strong>Owner Approved At:</strong> {dayjs(detailRequest.ownerApprovedAt).format('YYYY-MM-DD HH:mm')}
                 </p>
             )}
             {/* Display Maintenance Scheduled Date if available */}
             {detailRequest.maintenanceScheduledAt && (
                 <p>
                     <strong>Maintenance Scheduled At:</strong> {dayjs(detailRequest.maintenanceScheduledAt).format('YYYY-MM-DD HH:mm')}
                 </p>
             )}
              {/* Display Resolved Date if available */}
             {detailRequest.resolvedAt && (
                 <p>
                     <strong>Resolved At:</strong> {dayjs(detailRequest.resolvedAt).format('YYYY-MM-DD HH:mm')}
                 </p>
             )}
              {/* Display Tenant Approved Date if available */}
             {detailRequest.tenantApprovedAt && (
                 <p>
                     <strong>Tenant Approved At:</strong> {dayjs(detailRequest.tenantApprovedAt).format('YYYY-MM-DD HH:mm')}
                 </p>
             )}
          </div>
        )}
      </Modal>

      {/* Assuming there's a separate component or logic for tenants to add/edit/delete requests */}
      {/* The original code didn't include these forms/buttons in this component's main render */}
      {/* Adding a placeholder for a potential "Add Request" button if needed here */}
      {/* Example:
      {role === 'tenant' && (
          <Button type="primary" style={{ marginTop: 16 }} onClick={openModalForAdd}>
              Add New Request
          </Button>
      )}
      */}

    </div>
  );
};

export default MaintenanceRequests;