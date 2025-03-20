import React, { useContext, useRef, useState } from 'react';
import {Badge, Button, Divider, Input, Popconfirm, Space, Table} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { MdDelete, MdEdit } from 'react-icons/md';
import { FormatDateTime } from '../../../../helper/FormatDate';
import ModalForm from '../../../../modal/Modal';
import UpdateUserForm from '../../../forms/users/UpdateUserForm';
import { AlertContext } from '../../../../context/AlertContext';
import { BACKENDURL } from '../../../../helper/Urls';
import axios from 'axios';

const PostionTable = ({branchData,loading,reload}) => {
  const {openNotification} = useContext (AlertContext);
  const [searchedColumn, setSearchedColumn] = useState('');
  const [searchText, setSearchText] = useState('');
  const searchInput = useRef(null);
  const [modalOpen, setModalOpen] = useState (false);
  const [modalContent, setModalContent] = useState ([]);
  const [deleteLoading,setDeleteLoading]=useState(false)

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };
  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText('');
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


  const DeleteUser=async(id)=>{
    setDeleteLoading(true)
    try {
      // const res = await axios.get(`${BACKENDURL}/users/delete?id=${id}`);
      setDeleteLoading(false)
      reload()
      openNotification('success', 'Under work tho', 3, 'green');
    } catch (error) {
      setDeleteLoading(false)
      openNotification('error', error.response.data.message, 3, 'red');
    }
  }

  const columns = [
    {
      title: 'Postion Information',
      fixed: 'left',
      children: [
        {
          title: 'IDNO',
          dataIndex: 'IDNO',
          ...getColumnSearchProps('IDNO'),
          width:'80px',
          key: 'IDNO',
        },
        {
          title: 'Name',
          dataIndex: 'name',
          ...getColumnSearchProps('name'),
          key: 'name',
          width:"200px"
        },
        {
          title: 'Employees',
          dataIndex: 'employees',
          key: 'employees',
          width:'80px'
        },
        {
          title: 'Branch',
          dataIndex: 'branch',
          key: 'branch',
          width:'80px'
        },
        {
          title: 'Department',
          dataIndex: 'department',
          key: 'department',
          width:'80px'
        },
      ],
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      width:'150px',
      key: 'createdAt',
      render:r=>(<span>{FormatDateTime(r)}</span>)
    },
    {
     fixed: 'right',
     title: 'Status',
     width:'80px',
     key: 'status',
     render: (r) => <Badge status={r.status==="Active"?"success":'error'} text={r.status} />,
    },
    {
     title: 'Action',
     width:'165px',
     fixed: 'right',
     key: 'operation',
     render: (r) =>
     <Space style={{display:'flex',alignItems:'center',flexWrap:"wrap"}}>
     <Button type='text' onClick={() =>{setModalOpen (true);setModalContent(r.IDNO)}}><MdEdit/></Button>
     <Popconfirm title='Are you sure, Close Position' onConfirm={()=>DeleteUser(r.IDNO)}><Button type='text' disabled={deleteLoading} loading={deleteLoading}><MdDelete color='red'/></Button></Popconfirm>
     </Space>
    },
  ];


  return (
    <div>
    <ModalForm
          open={modalOpen}
          close={() => setModalOpen (false)}
          title={<Divider>Update Position Form</Divider>}
          content={''}
        />
    <Table
      size='small'
      columns={columns}
      scroll={{
        x: 500,
      }}
      pagination={{
        defaultPageSize: 7,
        showSizeChanger: false 
      }}
      dataSource={branchData}
      loading={loading}
    />
    </div>
  );
};
export default PostionTable;
