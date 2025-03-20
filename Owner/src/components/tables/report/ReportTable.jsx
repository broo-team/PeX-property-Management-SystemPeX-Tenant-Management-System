import React, { useEffect, useState } from 'react';
import { Table, Spin, Button, Modal, Form, Input } from 'antd';
import axios from 'axios';
import { BACKENDURL } from '../../../helper/Urls';

const ReportTable = () => {
  const [loading, setLoading] = useState(true);
  const [datas, setDatas] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BACKENDURL}/reports/reports`);
        setDatas(response.data);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const columns = [
    {
      title: 'User ID',
      dataIndex: 'userId',
      key: 'userId',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: 'Shift',
      dataIndex: 'shiftTime',
      key: 'shiftTime',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Report',
      dataIndex: 'report',
      key: 'report',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Report Measurement',
      dataIndex: 'reportMeasurement',
      key: 'reportMeasurement',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Button   type="primary" onClick={() => openEditModal(record)}>Edit</Button>
      ),
    },
  ];

  // Open the modal and populate the form with the selected report data
  const openEditModal = (record) => {
    setSelectedReport(record);
    form.setFieldsValue({
      ...record,
      date: new Date(record.date).toISOString().split('T')[0], // Format date for input field
    });
    setIsModalVisible(true);
  };

  // Close the modal
  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedReport(null);
  };

  // Submit updated data to backend
  const handleOk = async () => {
    try {
      const updatedValues = form.getFieldsValue();
      await axios.put(`${BACKENDURL}/reports/reports/${selectedReport.id}`, updatedValues);
      setDatas((prevData) =>
        prevData.map((item) =>
          item.id === selectedReport.id ? { ...item, ...updatedValues } : item
        )
      );
      setIsModalVisible(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('Error updating report:', error);
    }
  };

  return (
    <div>
      {loading ? (
        <Spin size="large" />
      ) : (
        <>
          <Table dataSource={datas} columns={columns} loading={false} rowKey="id" />

          <Modal
            title="Edit Report"
            visible={isModalVisible}
            onOk={handleOk}
            onCancel={handleCancel}
          >
            <Form form={form} layout="vertical">
              <Form.Item name="userId" label="User ID">
                <Input disabled />
              </Form.Item>
              <Form.Item name="date" label="Date">
                <Input type="date" />
              </Form.Item>
              <Form.Item name="shiftTime" label="Shift Time">
                <Input />
              </Form.Item>
              <Form.Item name="location" label="Location">
                <Input />
              </Form.Item>
              <Form.Item name="report" label="Report">
                <Input />
              </Form.Item>
              <Form.Item name="description" label="Description">
                <Input />
              </Form.Item>
              <Form.Item name="reportMeasurement" label="Report Measurement">
                <Input />
              </Form.Item>
              <Form.Item name="status" label="Status">
                <Input />
              </Form.Item>
            </Form>
          </Modal>
        </>
      )}
    </div>
  );
};

export default ReportTable;