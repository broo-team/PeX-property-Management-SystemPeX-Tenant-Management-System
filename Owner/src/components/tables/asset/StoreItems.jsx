import React, {useState} from 'react';
import {Button, Space, Table} from 'antd';
import {MdEdit} from 'react-icons/md';
import { FormatDay } from '../../../helper/FormateDay';

const StoreItems = ({datas, loading, reload}) => {
  const [modalOpen, setModalOpen] = useState (false);
  const [modalContent, setModalContent] = useState ([]);

  const columns = [
    {
      title: 'IDNO',
      dataIndex: 'IDNO',
      width: '100px',
      fixed:'left'
    },
    {
      title: 'Name',
      dataIndex: 'name',
      width: '120px',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      width: '100px',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      width: '100px',
      key: 'quantity',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      width: '100px',
      key: 'price',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      width: '200px',
      key: 'description',
    },
    {
      title: 'Registered',
      width: '100px',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render:r=>FormatDay(r)
    },
    {
      title: 'Action',
      width: '100px',
      key: 'action',
      render: (text, record) => (
        <>
          <Button>
            Edit
          </Button>
        </>
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
      dataSource={datas}
      loading={loading}
    />
  );
};
export default StoreItems;
