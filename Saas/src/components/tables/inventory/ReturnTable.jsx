import React, { useEffect, useState } from 'react';
import { Table, message } from 'antd';
import axios from 'axios';
import { BACKENDURL } from '../../../helper/Urls';

const ReturnTable = ({ loading, reload }) => {
  const [returnData, setReturnData] = useState([]);

  const fetchReturnData = async () => {
    try {
        const response = await axios.get(`${BACKENDURL}/request/returns`);
        console.log(response);
        setReturnData(response.data); // Ensure response data is correctly structured
    } catch (error) {
        console.error('Error fetching returns:', error);
        message.error('Failed to fetch return data');
    }
  };

  useEffect(() => {
    fetchReturnData(); // Fetch on mount
  }, []);

  const columns = [
    {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
    },
    {
        title: 'Inventory',
        dataIndex: 'inventory',
        key: 'inventory',
        render: (inventory) => (inventory ? inventory.name : 'Unknown'),
    },
    {
        title: 'Request ID',
        dataIndex: 'requestId',
        key: 'requestId',
    },
    {
        title: 'Employee',
        dataIndex: 'employee', // Adjusted to access the request object
        key: 'employee',
        render: (employeeName) => (employeeName ? employeeName.fName : 'Unknown'), // Display employee name or fallback
    },
    {
        title: 'Quantity',
        dataIndex: 'quantity',
        key: 'quantity',
    },
    {
        title: 'Date',
        dataIndex: 'createdAt', // Assuming you have this field in the return data
        key: 'date',
        render: (date) => (date ? new Date(date).toLocaleString() : 'Unknown'), // Format date as needed
    },
  ];

  return (
    <>
      <Table
        dataSource={returnData}
        columns={columns}
        loading={loading}
        rowKey="id"
        scroll={{ x: 'max-content' }} // Adjust width based on content
      />
    </>
  );
};

export default ReturnTable;