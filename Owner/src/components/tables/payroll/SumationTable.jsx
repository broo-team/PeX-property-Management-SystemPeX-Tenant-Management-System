import React, {useContext, useRef, useState} from 'react';
import {
  Badge,
  Button,
  Divider,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import {SearchOutlined} from '@ant-design/icons';
import {MdDelete, MdEdit} from 'react-icons/md';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL} from '../../../helper/Urls';
import axios from 'axios';
import {CSVLink} from 'react-csv';
import {FaFile} from 'react-icons/fa6';
import FiterTimeSheetForm from '../../forms/payroll/FiterTimeSheetForm';

const SumationTable = ({payrollDate, loading, reload}) => {
  const {openNotification} = useContext (AlertContext);
  const [searchedColumn, setSearchedColumn] = useState ('');
  const [searchText, setSearchText] = useState ('');
  const searchInput = useRef (null);
  const [modalOpen, setModalOpen] = useState (false);
  const [modalContent, setModalContent] = useState ([]);
  const [deleteLoading, setDeleteLoading] = useState (false);

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
      record[dataIndex]
        .toString ()
        .toLowerCase ()
        .includes (value.toLowerCase ()),
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
  
  const DeleteUser = async id => {
    setDeleteLoading (true);
    try {
      const res = await axios.get (`${BACKENDURL}/users/delete?id=${id}`);
      setDeleteLoading (false);
      reload ();
      openNotification ('success', res.data.message, 3, 'green');
    } catch (error) {
      setDeleteLoading (false);
      openNotification ('error', error.response.data.message, 3, 'red');
    }
  };

  const columns = [
    {
      title: 'IDNO',
      dataIndex: 'IDNO',
      ...getColumnSearchProps ('IDNO'),
      fixed: 'left',
      width: '80px',
      key: 'IDNO',
    },
    {
      title: 'Employee Information',
      children: [
        {
          title: 'Personal info',
          children: [
            {
              title: 'Name',
              dataIndex: 'name',
              ...getColumnSearchProps ('name'),
              key: 'name',
              width: '200px',
            },
            {
              title: 'Branch',
              dataIndex: 'branch',
              ...getColumnSearchProps ('branch'),
              key: 'branch',
              width: '200px',
            },
            {
              title: 'Department',
              dataIndex: 'branch',
              ...getColumnSearchProps ('branch'),
              key: 'branch',
              width: '200px',
            },
            {
              title: 'Position',
              dataIndex: 'position',
              ...getColumnSearchProps ('position'),
              key: 'position',
              width: '200px',
            },
          ],
        },
        {
          title: 'Work Place info',
          children: [
            {
              title: 'Site',
              dataIndex: 'site',
              ...getColumnSearchProps ('site'),
              key: 'site',
              width: '200px',
            },
            {
              title: 'City / Region',
              dataIndex: 'city',
              ...getColumnSearchProps ('city'),
              key: 'city',
              width: '200px',
            },
            {
              title: 'SubCity / Zone',
              dataIndex: 'subCity',
              ...getColumnSearchProps ('subCity'),
              key: 'subCity',
              width: '200px',
            },
            {
              title: 'Wereda',
              dataIndex: 'wereda',
              ...getColumnSearchProps ('wereda'),
              key: 'wereda',
              width: '200px',
            },
          ],
        },
      ],
    },
    {
      title: 'Payment Info',
      children: [
        {
          title: 'Basic Salary',
          dataIndex: 'basicSalary',
          key: 'basicSalary',
          width: '80px',
        },
        {
          title: 'Earnings',
          children: [
            {
              title: 'Taxable',
              dataIndex: 'earnings',
              render:(r)=>r.taxable,
              key: 'earnings',
              width: '80px',
            },
            {
              title: 'Non Taxable',
              dataIndex: 'earnings',
              key: 'earnings',
              render:(r)=>r.nonTaxable,
              width: '100px',
            },
            {
              title: 'Total',
              dataIndex: 'earnings',
              key: 'earnings',
              render:(r)=>r.total,
              width: '100px',
            },
          ],
        },
        {
          title: 'Gross Salary',
          dataIndex: 'grossSalary',
          key: 'grossSalary',
          width: '80px',
        },
        {
          title: 'Deduction',
          children: [
            {
              title: 'Income Tax',
              dataIndex: 'deductions',
              key: 'deductions',
              render:(r)=>r.incomeTax,
              width: '80px',
            },
            {
              title: 'PF 7%',
              dataIndex: 'deductions',
              key: 'deductions',
              render:(r)=>r.PF7,
              width: '80px',
            },
            {
              title: 'PF 11%',
              dataIndex: 'deductions',
              key: 'deductions',
              render:(r)=>r.PF11,
              width: '80px',
            },
            {
              title: 'Loan',
              dataIndex: 'deductions',
              key: 'deductions',
              render:(r)=>r.loan,
              width: '80px',
            },
            {
              title: 'Penality',
              dataIndex: 'deductions',
              render:(r)=>r.penalty,
              key: 'deductions',
              width: '100px',
            },
            {
              title: 'Total',
              dataIndex: 'deductions',
              key: 'deductions',
              render:(r)=>r.total,
              width: '100px',
            },
          ],
        },
        {
          title: 'Net Salary',
          dataIndex: 'netSalary',
          key: 'netSalary',
          width: '120px',
        },
      ],
    },

    {
      fixed: 'right',
      title: 'Status',
      width: '80px',
      key: 'status',
      render: r => (
        <Tag color={r.status === 'Pending' ? 'orange' : 'Green'}>
          {r.status}
        </Tag>
      ),
    },
    {
      title: 'Action',
      width: '165px',
      fixed: 'right',
      key: 'operation',
      render: r => (
        <Space
          style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap'}}
        >
          <Button
            type="text"
            onClick={() => {
              setModalOpen (true);
              setModalContent (r.IDNO);
            }}
          >
            <MdEdit />
          </Button>
          <Popconfirm
            title="Are you sure, Delete user"
            onConfirm={() => DeleteUser (r.IDNO)}
          >
            <Button
              type="text"
              disabled={deleteLoading}
              loading={deleteLoading}
            >
              <MdDelete color="red" />
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          height: '60px',
          justifyContent: 'space-between',
        }}
      >
        <span style={{fontSize: '20px'}}>Payroll List </span>
        <div style={{display: 'flex', gap: '10px'}}>
          <FiterTimeSheetForm />
        </div>
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
          showSizeChanger: false,
        }}
        dataSource={payrollDate}
        loading={loading}
      />
    </div>
  );
};
export default SumationTable;
