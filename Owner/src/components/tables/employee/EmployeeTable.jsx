import React, {useRef, useState} from 'react';
import {
  Badge,
  Button,
  DatePicker,
  Input,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import {SearchOutlined} from '@ant-design/icons';
import {FaFileCsv} from 'react-icons/fa6';
import { MdFilterAltOff} from 'react-icons/md';
import {CSVLink} from 'react-csv';
import {FormatDay} from '../../../helper/FormateDay';
import { Link } from 'react-router-dom';

const EmployeeTable = ({userData, loading, reload}) => {

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
        text
      ) : (
        text
      ),
  });


  const columns = [
    {
      title: 'IDNO',
      dataIndex: 'IDNO',
      ...getColumnSearchProps('IDNO'),
      width: '160px',
      fixed:'left',
      key: 'IDNO',
    },
    {
      title: 'Doc No',
      dataIndex: 'docNo',
      width: '100px',
      key: 'docNo',
    },
    {
      title: 'Employee Info',
      children: [
        {
          title: 'Rank',
          dataIndex: 'rank',
          width: '100px',
          key: 'rank',
          render: r => <Tag color='success'>{r}</Tag>,
        },
        {
          title: 'Full  2',
          width: '400px',
          render:r=><div><div>{r.fullName}</div><div>{r.fullNameEnglish}</div></div>
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
              width: '120px',
              key: 'lName',
            },
            ,
          ],
        },
        {
          title: 'Gender',
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
          // filteredValue: filteredInfo.sex || null,
          // onFilter: (value, record) => record.sex.includes(value),
        },
        {
          title: 'Date Of Birth',
          dataIndex: 'dateOfBirth',
          width: '150px',
          key: 'createdAt',
          render: r => <span>{FormatDay (r)}</span>,
        },
        {
          title: 'Nationality',
          dataIndex: 'nationality',
          key: 'nationality',
          width: '120px',
          filters: [
            {
              text: 'Ethiopian',
              value: 'Ethiopian',
            },
            {
              text: 'Kenya',
              value: 'Kenya',
            },
          ],
        },
      ],
    },
    {
      title: 'Work Info',
      children: [
        {
          title: 'Branch',
          dataIndex: 'branch',
          width: '100px',
          key: 'branch',
          filters: [
            {
              text: 'Arada Adwa',
              value: 'Arada Adwa',
            },
          ],
        },
        {
          title: 'Department',
          dataIndex: 'department',
          width: '120px',
          key: 'department',
          filters: [
            {
              text: 'Security',
              value: 'Security',
            },
          ],
        },
        {
          title: 'Position',
          dataIndex: 'position',
          width: '120px',
          key: 'position',
          filters: [
            {
              text: 'Security Guard',
              value: 'Security Guard',
            },
          ],
        },
        {
          title: 'Start Date',
          dataIndex: 'startDate',
          width: '100px',
          render: r => <span>{FormatDay(r)}</span>,
          key: 'startDate',
        },
        {
          title: 'Employement Type',
          dataIndex: 'employementType',
          width: '120px',
          key: 'employementType',
          filters: [
            {
              text: 'Full Time',
              value: 'Full Time',
            },
            {
              text: 'Permanenent',
              value: 'Permanenent',
            },
            {
              text: 'Temporary',
              value: 'Temporary',
            },
          ],
        },
        {
          title: 'Shift',
          dataIndex: 'shift',
          width: '80px',
          key: 'shift',
        },
        {
          title: 'Salary',
          dataIndex: 'salary',
          width: '80px',
          key: 'salary',
        },
      ],
    },
    {
      title: 'Registered',
      dataIndex: 'registered',
      width: '150px',
      key: 'registered',
      render: r => <span>{FormatDay(r)}</span>,
    },
    {
      fixed: 'right',
      title: 'Status',
      width: '80px',
      key: 'status',
      filters: [
        {
          text: 'Active',
          value: 'Active',
        },
        {
          text: 'InActive',
          value: 'InActive',
        },
      ],
      render: r => (
        <Badge
          status={r.status === 'Active' ? 'success' : 'error'}
          text={r.status}
        />
      ),
    },
    {
      title: 'Action',
      width: '70px',
      fixed: 'right',
      key: 'operation',
      render: r => (
        <Tooltip title='View Detail'
        >
          <Link to={`/employee/detail/${r.IDNO}`}>
            Detail
          </Link>
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <div style={{display:'flex',width:"100%",gap:'5px',marginBottom:"5px",justifyContent:'flex-end'}}>
      <CSVLink
        data={[]}
        filename={"employee-detail-csv"}>
          <Button><FaFileCsv/>CSV</Button>
      </CSVLink>
      <Button onClick={()=>{}}><MdFilterAltOff/> Clear filters</Button>
      </div>
      <Table
      size="small"
      columns={columns}
      bordered
      scroll={{
        x: 500,
      }}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
      }}
      dataSource={userData}
      onChange={()=>{}}
      loading={loading}
    />
    </div>
  );
};
export default EmployeeTable;