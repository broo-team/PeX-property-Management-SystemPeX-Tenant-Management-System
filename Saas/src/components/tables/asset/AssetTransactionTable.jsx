import React, {useState} from 'react';
import {Button, Space, Table} from 'antd';
import {MdEdit} from 'react-icons/md';
import { FormatDay, FormatMonth } from '../../../helper/FormateDay';

const AssetTransactionTable = ({categoryData, loading, reload}) => {
  const [modalOpen, setModalOpen] = useState (false);
  const [modalContent, setModalContent] = useState ([]);

  const columns = [
    {
      title: 'Ref No',
      dataIndex: 'RefNo',
      width: '100px',
    },
    {
      title: 'Employee',
      dataIndex: 'employee',
      width: '100px',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      width: '100px',
      key: 'description',
    },
    {
      title: 'Action',
      width: '40px',
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
      dataSource={categoryData}
      loading={loading}
    />
  );
};
export default AssetTransactionTable;
