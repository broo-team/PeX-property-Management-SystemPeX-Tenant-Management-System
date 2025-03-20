import React, {useState} from 'react';
import {Button, Space, Table} from 'antd';
import {MdEdit} from 'react-icons/md';
import { FormatDay, FormatMonth } from '../../../helper/FormateDay';

const LeaveAllocation = ({leaveData, loading, reload}) => {
  const [modalOpen, setModalOpen] = useState (false);
  const [modalContent, setModalContent] = useState ([]);

  const columns = [
    {
      title: 'Max Leave Count',
      dataIndex: 'count',
      width: '50px',
      render: r => <span>{r} days</span>,
      key: 'count',
    },
    {
      title: 'Start Month',
      dataIndex: 'startMonth',
      render: r => FormatMonth(r),
      width: '50px',
      key: 'startMonth',
    },
    {
      title: 'End Month',
      dataIndex: 'endMonth',
      render: r => FormatMonth(r),
      width: '50px',
      key: 'endMonth',
    },
    {
      title: 'Used Leave',
      dataIndex: 'used',
      width: '60px',
      render: r => <span>{r} days</span>,
      key: 'used',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      render: r => FormatDay(r),
      width: '100px',
      key: 'createdAt',
    },
    {
      title: 'Action',
      width: '100px',
      fixed: 'right',
      key: 'operation',
      render: r => (
        <Space
          style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap'}}
        >
          <Button type="text">
            <MdEdit />
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      size="small"
      columns={columns}
      scroll={{
        x: 500,
      }}
      pagination={{
        defaultPageSize: 7,
        showSizeChanger: false,
      }}
      dataSource={leaveData}
      loading={loading}
    />
  );
};
export default LeaveAllocation;
