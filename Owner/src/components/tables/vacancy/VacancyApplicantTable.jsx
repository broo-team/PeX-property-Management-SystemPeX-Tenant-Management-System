import React, {useContext, useRef, useState} from 'react';
import {
  Button,
  Input,
  Space,
  Table,
  Tag,
} from 'antd';
import {SearchOutlined} from '@ant-design/icons';
import {FormatDateTime} from '../../../helper/FormatDate';
import {AlertContext} from '../../../context/AlertContext';
import {Link} from 'react-router-dom';
import { FormatDay } from '../../../helper/FormateDay';

const VacancyApplicantTable = ({vacancyApplicantData, loading, reload}) => {
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

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div
        style={{
          padding: 8,
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{
            marginBottom: 8,
            display: 'block',
          }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{
              width: 90,
            }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
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
    filterIcon: (filtered) => (
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
      width: '160px',
      key: 'IDNO',
    },
    {
      title: 'Full Name',
      children: [
        {
          title: 'First',
          dataIndex: 'fName',
          ...getColumnSearchProps ('fName'),
          width: '120px',
          key: 'fName',
        },
        {
          title: 'Middle',
          dataIndex: 'mName',
          ...getColumnSearchProps ('mName'),
          width: '120px',
          key: 'mName',
        },
        {
          title: 'Last',
          dataIndex: 'lName',
          ...getColumnSearchProps ('lName'),
          width: '90px',
          key: 'lName',
        },
        ,
      ],
    },
    {
      title: 'sex',
      dataIndex: 'sex',
      ...getColumnSearchProps ('sex'),
      key: 'sex',
      width: '140px',
    },
    {
      title: 'Date Of Birth',
      dataIndex: 'dateOfBirth',
      width: '150px',
      key: 'dateOfBirth',
      render: r => <span>{FormatDay (r)}</span>,
    },
    {
      title: 'Nationality',
      dataIndex: 'nationality',
      key: 'nationality',
      width: '120px',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      width: '150px',
      key: 'createdAt',
      render: r => <span>{FormatDateTime (r)}</span>,
    },
    {
      title: 'Score',
      width: '120px',
      render: r => <span>{r.score}/{r.maxScore}</span>,
    },
    {
      fixed: 'right',
      title: 'Status',
      width: '80px',
      key: 'status',
      render: r => (
        <Tag
          color={r.status === 'Pending' ?'processing':r.status === 'Hired'?"success" : 'volcano'}
        >{r.status}</Tag>
      ),
    },
    {
      title: 'Action',
      width: '180px',
      fixed: 'right',
      key: 'operation',
      render: r => (
        <Space
          style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap'}}
        >
          <Link to={`/vacancy/applicant/detail/${r.id}`}>
            Detail
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <div>
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
        dataSource={vacancyApplicantData}
        loading={loading}
      />
    </div>
  );
};
export default VacancyApplicantTable;
