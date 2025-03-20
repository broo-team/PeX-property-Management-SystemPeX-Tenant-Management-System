import React, {useContext, useRef, useState} from 'react';
import {
  Button,
  Input,
  Popconfirm,
  Space,
  Table,
  Tag,
} from 'antd';
import {SearchOutlined} from '@ant-design/icons';
import {MdDelete, MdEdit} from 'react-icons/md';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL} from '../../../helper/Urls';
import axios from 'axios';

const IncomeTaxTable = ({incomeTaxDate, loading, reload}) => {
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
    // onFilterDropdownOpenChange: (visible) => {
    //   if (visible) {
    //     setTimeout(() => searchInput.current?.select(), 100);
    //   }
    // },
    // render: (text) =>
    //   searchedColumn === dataIndex ? (
    //     searchText
    //   ) : (
    //     text
    //   ),
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
      title: 'TIN',
      dataIndex: 'TIN',
      ...getColumnSearchProps ('TIN'),
      fixed: 'left',
      width: '80px',
      key: 'TIN',
    },

    {
      title: 'Full Name',
      dataIndex: 'fullName',
      ...getColumnSearchProps ('fullName'),
      key: 'fullName',
      width: '200px',
    },

    {
      title: 'Hired Date',
      dataIndex: 'hiredDate',
      key: 'hiredDate',
      width: '120px',
    },
    {
      title: 'Salary',
      dataIndex: 'salary',
      key: 'salary',
      width: '80px',
    },
    {
      title: 'Total Transport',
      dataIndex: 'totalTransport',
      key: 'totalTransport',
      width: '80px',
    },
    {
      title: 'Extra Payments',
      children:[
        {
          title: 'Transport With Tax',
          dataIndex: 'totalTransportTax',
          key: 'totalTransportTax',
          width: '80px',
        },
        {
          title: 'Over Time',
          dataIndex: 'overTime',
          key: 'overTime',
          width: '80px',
        },
      
        {
          title: 'Taxable Benfits',
          dataIndex: 'taxableBenfits',
          key: 'taxableBenfits',
          width: '80px',
        },]
    },
    {
      title: 'Total Taxable Salary',
      dataIndex: 'totalTaxableSalarys',
      key: 'totalTaxableSalary',
      width: '100px',
    },
    {
      title: 'Income Tax',
      dataIndex: 'incomeTax',
      key: 'incomeTax',
      width: '100px',
    },
    {
      title: 'Cost Sharing',
      dataIndex: 'costSharing',
      key: 'costSharing',
      width: '100px',
    },
    {
      title: 'Net Payment',
      dataIndex: 'netPayment',
      key: 'netPayment',
      width: '100px',
    },
    // {
    //   fixed: 'right',
    //   title: 'Status',
    //   width: '80px',
    //   key: 'status',
    //   render: r => (
    //     <Tag color={r.status === 'Pending' ? 'orange' : 'Green'}>
    //       {r.status}
    //     </Tag>
    //   ),
    // },
    // {
    //   title: 'Action',
    //   width: '165px',
    //   fixed: 'right',
    //   key: 'operation',
    //   render: r => (
    //     <Space
    //       style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap'}}
    //     >
    //       <Button
    //         type="text"
    //         onClick={() => {
    //           setModalOpen (true);
    //           setModalContent (r.IDNO);
    //         }}
    //       >
    //         <MdEdit />
    //       </Button>
    //       <Popconfirm
    //         title="Are you sure, Delete user"
    //         onConfirm={() => DeleteUser (r.IDNO)}
    //       >
    //         <Button
    //           type="text"
    //           disabled={deleteLoading}
    //           loading={deleteLoading}
    //         >
    //           <MdDelete color="red" />
    //         </Button>
    //       </Popconfirm>
    //     </Space>
    //   ),
    // },
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
          defaultPageSize: 10,
          showSizeChanger: false,
        }}
        dataSource={incomeTaxDate}
        loading={loading}
      />
  );
};
export default IncomeTaxTable;
