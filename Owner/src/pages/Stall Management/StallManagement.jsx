import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Row,
  Col,
  Space,
  Select,
  message,
} from 'antd';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const { TabPane } = Tabs;
const { Option } = Select;

const StallManagement = () => {
  const { account, accountType, authLoading } = useAuth();
  const owner = accountType === "owner" ? account : null;
  // Define the building ID for which data should be shown.
  const buildingId = 3;

  // Form instances for stall create/edit and room create/edit
  const [stallForm] = Form.useForm();
  const [stallEditForm] = Form.useForm();
  const [roomEditForm] = Form.useForm();
  const [roomCreateForm] = Form.useForm();

  // States for stalls and rooms
  const [stalls, setStalls] = useState([]);
  const [rooms, setRooms] = useState([]);

  // States for currently editing records
  const [editingStall, setEditingStall] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingStallId, setEditingStallId] = useState(null);

  // Modal visibility states
  const [isStallModalVisible, setIsStallModalVisible] = useState(false); // Create Stall
  const [isStallEditModalVisible, setIsStallEditModalVisible] = useState(false); // Edit Stall
  const [isRoomEditModalVisible, setIsRoomEditModalVisible] = useState(false); // Edit Room
  const [isRoomCreateModalVisible, setIsRoomCreateModalVisible] = useState(false); // Create Room

  // Loading states
  const [loading, setLoading] = useState(false);
  const [roomLoading, setRoomLoading] = useState(false);

  // Search term for filtering rooms by name
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch stalls and rooms when component mounts
  useEffect(() => {
    fetchStalls();
    fetchRooms();
  }, []);

  // Fetch all stalls from the backend.
  const fetchStalls = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/stalls');
      setStalls(response.data);
    } catch (error) {
      message.error('Failed to fetch stalls');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all rooms using the endpoint.
  const fetchRooms = async () => {
    setRoomLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/stalls/getRooms');
      // Assume the API returns [[{...}, {...}, ...]] so we extract the first element.
      const roomData =
        Array.isArray(response.data) && Array.isArray(response.data[0])
          ? response.data[0]
          : response.data;
      setRooms(roomData);
    } catch (error) {
      message.error('Failed to fetch rooms');
    } finally {
      setRoomLoading(false);
    }
  };

  // Create a new stall (forcing building_id to be the set buildingId)
  const handleCreateStall = async () => {
    try {
      const values = await stallForm.validateFields();
      const payload = {
        stallCode: values.stallCode,
        floorsize: values.floorsize,
        building_id: buildingId, // force to use the desired building id
      };
      await axios.post('http://localhost:5000/stalls', payload);
      message.success('Stall created successfully!');
      fetchStalls();
      stallForm.resetFields();
      setIsStallModalVisible(false);
    } catch (error) {
      message.error('Failed to create stall');
    }
  };

  // Delete a stall.
  const handleDeleteStall = async (stallId) => {
    try {
      await axios.delete(`http://localhost:5000/stalls/${stallId}`);
      message.success('Stall deleted successfully!');
      fetchStalls();
      fetchRooms(); // refresh room data in case a deleted stall affected them
    } catch (error) {
      message.error('Failed to delete stall');
    }
  };

  // Open modal to edit a stall.
  const openStallEditModal = (record) => {
    setEditingStall(record);
    stallEditForm.setFieldsValue({
      stallCode: record.stallCode,
      floorsize: record.floorsize,
      building_id: record.building_id,
    });
    setIsStallEditModalVisible(true);
  };

  // Update stall details.
  const handleUpdateStall = async (values) => {
    try {
      const payload = {
        stallCode: values.stallCode,
        floorsize: values.floorsize,
        building_id: buildingId, // keep building_id fixed
      };
      await axios.put(`http://localhost:5000/stalls/${editingStall.id}`, payload);
      message.success('Stall updated successfully!');
      fetchStalls();
      setIsStallEditModalVisible(false);
      stallEditForm.resetFields();
    } catch (error) {
      message.error('Failed to update stall');
    }
  };

  // Create a new room.
  // Use the endpoint: http://localhost:5000/stalls/${stallId}/rooms
  const handleCreateRoom = async () => {
    try {
      const values = await roomCreateForm.validateFields();
      const { stall_id, roomName, size, monthlyRent, eeuReader, status } = values;
      await axios.post(`http://localhost:5000/stalls/${stall_id}/rooms`, {
        roomName,
        size,
        monthlyRent,
        eeuReader,
        status,
      });
      message.success('Room created successfully!');
      fetchRooms();
      roomCreateForm.resetFields();
      setIsRoomCreateModalVisible(false);
    } catch (error) {
      message.error('Failed to create room');
    }
  };

  // Delete a room.
  const handleDeleteRoom = async (roomId) => {
    try {
      await axios.delete(`http://localhost:5000/rooms/${roomId}`);
      message.success('Room deleted successfully!');
      fetchRooms();
    } catch (error) {
      message.error('Failed to delete room');
    }
  };

  // Open modal to edit a room.
  const openRoomEditModal = (record) => {
    console.log('Record being edited:', record);
    setEditingRoom(record);
    const stallId = record.stall_id;
    setEditingStallId(stallId);
    roomEditForm.setFieldsValue({
      roomName: record.roomName,
      size: record.size,
      monthlyRent: record.monthlyRent,
      eeuReader: record.eeuReader,
      status: record.status || 'Available',
    });
    setIsRoomEditModalVisible(true);
  };

  // Update room details.
  const handleUpdateRoom = async (values) => {
    try {
      const size = Number(values.size);
      const monthlyRent = Number(values.monthlyRent);

      if (isNaN(size) || isNaN(monthlyRent)) {
        message.error('Size and Monthly Rent must be valid numbers');
        return;
      }

      await axios.put(
        `http://localhost:5000/stalls/${editingRoom.stall_id}/rooms/${editingRoom.id}`,
        {
          roomName: values.roomName,
          size,
          monthlyRent,
          eeuReader: values.eeuReader,
          status: values.status,
        }
      );
      message.success('Room updated successfully!');
      fetchRooms();
      setIsRoomEditModalVisible(false);
      roomEditForm.resetFields();
    } catch (error) {
      message.error('Failed to update room');
    }
  };

  // Filter stalls by the defined building ID.
  const filteredStalls = stalls.filter(
    (stall) => Number(stall.building_id) === buildingId
  );

  // Filter rooms so that only rooms whose stall belongs to the building are shown,
  // and filter by room name based on the search term.
  const filteredRooms = rooms
    .filter((room) => {
      const stall = stalls.find((s) => s.id === room.stall_id);
      return stall && Number(stall.building_id) === buildingId;
    })
    .filter((room) =>
      room.roomName.toLowerCase().includes(searchTerm.toLowerCase())
    );

  /* ------------------ TABLE COLUMNS ------------------ */

  // Define table columns for the stall list.
  const stallColumns = [
    { title: 'Stall Code', dataIndex: 'stallCode', key: 'stallCode' },
    { title: 'Floor Size', dataIndex: 'floorsize', key: 'floorsize' },
    { title: 'Building ID', dataIndex: 'building_id', key: 'building_id' },

    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => openStallEditModal(record)}>
            Edit
          </Button>
          <Button type="link" danger onClick={() => handleDeleteStall(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  // Define table columns for the room list.
  // It includes a "Stall Code" column (by matching stall_id) and a "Status" column.
  const roomColumns = [
    {
      title: 'Stall Code',
      key: 'stallCode',
      render: (_, record) => {
        const stall = stalls.find((s) => s.id === record.stall_id);
        return stall ? stall.stallCode : 'N/A';
      },
    },
    { title: 'Room Name', dataIndex: 'roomName', key: 'roomName' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (status ? `Occupied` : 'Available'),
    },
    { title: 'Size', dataIndex: 'size', key: 'size' },
    { title: 'Monthly Rent', dataIndex: 'monthlyRent', key: 'monthlyRent' },
    { title: 'EEU Reader', dataIndex: 'eeuReader', key: 'eeuReader' },
    // { title: 'Created At', dataIndex: 'created_at', key: 'created_at' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => openRoomEditModal(record)}>
            Edit
          </Button>
          <Button type="link" danger onClick={() => handleDeleteRoom(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  /* ------------------ RENDER COMPONENT ------------------ */

  return (
    <div style={{ padding: '20px' }}>

      <Tabs defaultActiveKey="stalls">
        
        {/* Stalls Tab */}
        <TabPane tab="Stalls" key="stalls">
          <Space style={{ marginBottom: 16 }}>
            {
              owner ?(<Button type="default" onClick={() => setIsStallModalVisible(true)}>
        Create Stall
      </Button>) : <div style={{color:"red"}}>only admin can create stall</div>
            }
          
          </Space>
          <Table
            columns={stallColumns}
            dataSource={filteredStalls}
            rowKey="id"
            loading={loading}
          />
        </TabPane>

        {/* Rooms Tab */}
        <TabPane tab="Rooms" key="rooms">
          <Space style={{ marginBottom: 16 }}>
            {owner ? <Button type="default" onClick={() => setIsRoomCreateModalVisible(true)}>
              Create Room
            </Button>
            : <div style={{color:"red"}}>only can admin create rooms</div>
            }
            
            <Input.Search
              placeholder="Search by room name"
              allowClear
              onSearch={(value) => setSearchTerm(value)}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 200 }}
            />
          </Space>
          <Table
            columns={roomColumns}
            dataSource={filteredRooms}
            rowKey="id"
            loading={roomLoading}
          />
        </TabPane>
      </Tabs>

      {/* Modal for Creating New Stall */}
      <Modal
        title="Create New Stall"
        visible={isStallModalVisible}
        onCancel={() => {
          stallForm.resetFields();
          setIsStallModalVisible(false);
        }}
        footer={null}
      >
        
        <Form form={stallForm} layout="vertical" onFinish={handleCreateStall}>
          <Form.Item
            name="stallCode"
            label="Stall Code"
            rules={[{ required: true, message: 'Please enter the stall code' }]}
          >
            <Input placeholder="Enter stall code" />
          </Form.Item>
          <Form.Item
            name="floorsize"
            label="Floor Size"
            rules={[{ required: true, message: 'Please enter the Floor Size' }]}
          >
            <Input placeholder="Enter floor size" />
          </Form.Item>
          <Form.Item
            name="building_id"
            label="Building ID"
            initialValue={buildingId}
            rules={[{ required: true, message: 'Building ID is required' }]}
          >
            <Input disabled />
          </Form.Item>
          {/* <Button type="primary" htmlType="submit">
            Create Stall
          </Button> */}
        </Form>
      </Modal>

      {/* Modal for Editing Stall */}
      <Modal
        title="Edit Stall"
        visible={isStallEditModalVisible}
        onCancel={() => {
          stallEditForm.resetFields();
          setIsStallEditModalVisible(false);
        }}
        footer={null}
      >
        <Form form={stallEditForm} layout="vertical" onFinish={handleUpdateStall}>
          <Form.Item
            name="stallCode"
            label="Stall Code"
            rules={[{ required: true, message: 'Please enter the stall code' }]}
          >
            <Input placeholder="Enter stall code" />
          </Form.Item>
          <Form.Item
            name="floorsize"
            label="Floor Size"
            rules={[{ required: true, message: 'Please enter the Floor Size' }]}
          >
            <Input placeholder="Enter floor size" />
          </Form.Item>
          <Form.Item
            name="building_id"
            label="Building ID"
            initialValue={buildingId}
            rules={[{ required: true, message: 'Building ID is required' }]}
          >
            <Input disabled />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Update Stall
          </Button>
        </Form>
      </Modal>

      {/* Modal for Creating New Room */}
      <Modal
        title="Create New Room"
        visible={isRoomCreateModalVisible}
        onCancel={() => {
          roomCreateForm.resetFields();
          setIsRoomCreateModalVisible(false);
        }}
        footer={null}
      >
        <Form form={roomCreateForm} layout="vertical" onFinish={handleCreateRoom}>
          <Form.Item
            name="stall_id"
            label="Stall"
            rules={[{ required: true, message: 'Please select a stall' }]}
          >
            <Select placeholder="Select stall">
              {filteredStalls.map((stall) => (
                <Option key={stall.id} value={stall.id}>
                  {stall.stallCode}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="roomName"
            label="Room Name"
            rules={[{ required: true, message: 'Please enter the room name' }]}
          >
            <Input placeholder="Enter room name" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="size"
                label="Size"
                rules={[{ required: true, message: 'Please enter the room size' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="monthlyRent"
                label="Monthly Rent"
                rules={[{ required: true, message: 'Please enter the monthly rent' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="eeuReader" label="EEU Reader">
            <Input placeholder="Enter EEU Reader" />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Create Room
          </Button>
        </Form>
      </Modal>

      {/* Modal for Editing Room */}
      <Modal
        title="Edit Room"
        visible={isRoomEditModalVisible}
        onCancel={() => {
          roomEditForm.resetFields();
          setIsRoomEditModalVisible(false);
        }}
        footer={null}
      >
        <Form form={roomEditForm} layout="vertical" onFinish={handleUpdateRoom}>
          <Form.Item
            name="roomName"
            label="Room Name"
            rules={[{ required: true, message: 'Please enter the room name' }]}
          >
            <Input placeholder="Enter room name" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="size"
                label="Size"
                rules={[{ required: true, message: 'Please enter the room size' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="monthlyRent"
                label="Monthly Rent"
                rules={[{ required: true, message: 'Please enter the monthly rent' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="eeuReader" label="EEU Reader">
            <Input placeholder="Enter EEU Reader" />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Update Room
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default StallManagement;
