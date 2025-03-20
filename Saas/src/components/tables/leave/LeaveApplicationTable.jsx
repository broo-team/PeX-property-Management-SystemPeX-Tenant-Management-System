import React, {useContext, useRef, useState} from 'react';
import {
  Button,
  Input,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import {SearchOutlined} from '@ant-design/icons';
import {MdCancel, MdEdit} from 'react-icons/md';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL} from '../../../helper/Urls';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FormatDay } from '../../../helper/FormateDay';
import { FaCheck, FaEdit } from 'react-icons/fa';

const LeaveApplicationTable = ({applicationData, loading, reload}) => {
  const {openNotification} = useContext (AlertContext);
  const [searchedColumn, setSearchedColumn] = useState ('');
  const [searchText, setSearchText] = useState ('');
  const searchInput = useRef (null);
  const [modalOpen, setModalOpen] = useState (false);
  const [modalContent, setModalContent] = useState ([]);
  const [approveLoading, setApproveLoading] = useState (false);
  const [failLoading, setFailLoading] = useState (false);

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

  const ApproveApplication = async (id) => {
    setApproveLoading (true);
    try {
      const res = await axios.get (
        `${BACKENDURL}/leave/application/approve?id=${id}`
      );
      openNotification ('success', res.data.message, 3, 'green');
      reload ();
      setApproveLoading (false);
    } catch (error) {
      setApproveLoading (false);
      openNotification ('error', error.response.data.message, 3, 'red');
    }
  };

  const AmendApplication = async (id) => {
    setApproveLoading (true);
    try {
      const res = await axios.get (
        `${BACKENDURL}/leave/application/amend?id=${id}`
      );
      openNotification ('success', res.data.message, 3, 'green');
      reload ();
      setApproveLoading (false);
    } catch (error) {
      setApproveLoading (false);
      openNotification ('error', error.response.data.message, 3, 'red');
    }
  };

  const FailApplication = async id => {
    setFailLoading (true);
    try {
      const res = await axios.get (`${BACKENDURL}/leave/application/fail?id=${id}`);
      setFailLoading (false);
      reload ();
      openNotification ('success', res.data.message, 3, 'green');
    } catch (error) {
      setFailLoading (false);
      openNotification ('error', error.response.data.message, 3, 'red');
    }
  };

  const columns = [
    {
      title: 'IDNO',
      dataIndex: 'IDNO',
      ...getColumnSearchProps ('IDNO'),
      width: '140px',
      fixed:'left',
      key: 'IDNO',
      render:r=><Link to={`/employee/detail/${r}`}>{r}</Link>
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
              key: 'fName',
            },
            {
              title: 'Middle',
              dataIndex: 'mName',
              ...getColumnSearchProps ('mName'),
              width: '90px',
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
      title: 'Leave Type',
      dataIndex: 'leaveType',
      width: '120px',
      key: 'leaveType',
    },
    {
      title: 'Request Days',
      dataIndex: 'totalDay',
      width: '100px',
      key: 'totalDay',
    },
    {
      title: 'From',
      dataIndex: 'startDate',
      width: '100px',
      key: 'startDate',
      render: r => <span>{FormatDay(r)}</span>,
    },
    {
      title: 'To',
      dataIndex: 'endDate',
      width: '100px',
      key: 'endDate',
      render: r => <span>{FormatDay(r)}</span>,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      width: '120px',
      key: 'createdAt',
      render: r => <span>{FormatDay(r)}</span>,
    },
    {
      fixed: 'right',
      title: 'Status',
      width: '80px',
      key: 'status',
      filters: [
        {
          text: 'Approved',
          value: 'Approved',
        },
        {
          text: 'Pending',
          value: 'Pending',
        },
        {
          text: 'Failed',
          value: 'Failed',
        },
      ],
      render: r => (
        <Tag
          color={r.status === 'Approved' ? 'success' :r.status === 'Pending' ?"processing": 'volcano'}
        >{r.status}</Tag>
      ),
    },
    
    {
      title: 'Action',
      width: '180px',
      fixed: 'right',
      key: 'operation',
      render: r => (
          <Space>
            {r.status==="Approved"?
            <Popconfirm title="Are you sure , To Amend Application" onConfirm={()=>AmendApplication(r.id)}>
            <Tooltip title="Amend"><Button><MdEdit/></Button></Tooltip>
            </Popconfirm>:<>
            <Tooltip title="Edit"><Button><FaEdit/></Button></Tooltip>
            <Popconfirm title="Are you sure , To Fail Application" onConfirm={()=>FailApplication(r.id)}>
            <Tooltip title="Cancel"><Button><MdCancel color='red'/></Button></Tooltip>
            </Popconfirm>
            <Popconfirm title="Are you sure , To Approve Application" onConfirm={()=>ApproveApplication(r.id)}>
            <Tooltip title="Approve"><Button><FaCheck color='green'/></Button></Tooltip>
            </Popconfirm>
            </>
            }
          </Space>
      ),
    },
  ];

  return (
    <Table
      size="small"
      columns={columns}
      bordered
      scroll={{
        x: 500,
      }}
      pagination={{
        defaultPageSize: 7,
        showSizeChanger: false,
      }}
      dataSource={applicationData}
      loading={loading}
    />
  );
};
export default LeaveApplicationTable;
