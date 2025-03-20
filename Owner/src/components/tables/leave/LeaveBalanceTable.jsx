import React, {useContext, useRef, useState} from 'react';
import {
  Button,
  Input,
  Space,
  Table,
  Tag,
} from 'antd';
import {SearchOutlined} from '@ant-design/icons';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL} from '../../../helper/Urls';
import axios from 'axios';
import { Link } from 'react-router-dom';

const LeaveBalanceTable = ({leaveData, loading}) => {
  const {openNotification} = useContext (AlertContext);
  const [searchedColumn, setSearchedColumn] = useState ('');
  const [searchText, setSearchText] = useState ('');
  const searchInput = useRef (null);

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm ();
    setSearchText (selectedKeys[0]);
    setSearchedColumn (dataIndex);
  };
  const handleReset = clearFilters => {
    clearFilters ();
    setSearchText ('');
  };

  const getColumnSearchProps = dataIndex => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }) => (
      <div
        style={{
          padding: 8,
        }}
        onKeyDown={e => e.stopPropagation ()}
      >
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e =>
            setSelectedKeys (e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch (selectedKeys, confirm, dataIndex)}
          style={{
            marginBottom: 8,
            display: 'block',
          }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch (selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{
              width: 90,
            }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset (clearFilters)}
            size="small"
            style={{
              width: 90,
            }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => (
      <SearchOutlined
        style={{
          color: filtered ? '#1677ff' : undefined,
        }}
      />
    ),
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        searchText
      ) : (
        text
      ),
  });

  const columns = [
    {
      title: 'IDNO',
      dataIndex: 'IDNO',
      ...getColumnSearchProps ('IDNO'),
      width: '100px',
      fixed:'left',
      render:r=><Link to={`/employee/detail/${r}`}>{r}</Link>,
      key: 'IDNO',
    },
    {
      title: 'Employee Info',
      children: [
        {
          title: 'Full Name',
          children: [
            {
              title: 'First',
              dataIndex: 'fName',
              ...getColumnSearchProps ('fName'),
              width: '90px',
              render: r=>r,
              key: 'fName',
            },
            {
              title: 'Middle',
              dataIndex: 'mName',
              ...getColumnSearchProps ('mName'),
              render: r=>r,
              width: '90px',
              key: 'mName',
            },
            {
              title: 'Last',
              dataIndex: 'lName',
              ...getColumnSearchProps ('lName'),
              render: r=>r,
              width: '90px',
              key: 'lName',
            },
            ,
          ],
        },
        {
          title: 'Sex',
          dataIndex: 'sex',
          key: 'sex',
          width: '80px',
          filters: [
            {
              text: 'Male',
              value: 'Male',
            },
            {
              text: 'Female',
              value: 'Female',
            },
          ],
        },
      ],
    },
    {
      title: 'Used',
      dataIndex: 'used',
      width: '80px',
      key: 'used',
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      width: '150px',
      key: 'balance',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: '150px',
      key: 'status',
      render: r => (
        <Tag
          color={r === 'Active' ? 'success' :'volcano'}
        >{r}</Tag>
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
      bordered
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
      }}
      dataSource={leaveData}
      loading={loading}
    />
  );
};
export default LeaveBalanceTable;
