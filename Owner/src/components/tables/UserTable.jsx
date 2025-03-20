import React, { useContext, useRef, useState } from 'react';
import {Badge, Button, Divider, Input, Popconfirm, Space, Table, Tag} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { FaUserLock } from 'react-icons/fa6';
import { MdDelete, MdEdit } from 'react-icons/md';
import { FormatDateTime } from '../../helper/FormatDate';
import ModalForm from '../../modal/Modal';
import UpdateUserForm from '../forms/users/UpdateUserForm';
import { AlertContext } from '../../context/AlertContext';
import { BACKENDURL } from '../../helper/Urls';
import axios from 'axios';
import { Link } from 'react-router-dom'

const UserTable = ({userData,loading,reload}) => {
  const {openNotification} = useContext (AlertContext);
  const [searchedColumn, setSearchedColumn] = useState('');
  const [searchText, setSearchText] = useState('');
  const searchInput = useRef(null);
  const [modalOpen, setModalOpen] = useState (false);
  const [modalContent, setModalContent] = useState ([]);
  const [banLoading,setBanLoading]=useState(false)
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


  const BanUser=async({id,status})=>{
    setBanLoading(true)
    try {
      const res = await axios.get(`${BACKENDURL}/users/ban?id=${id}&&status=${status}`);
      openNotification('success', res.data.message, 3, 'green');
      reload()
      setBanLoading(false)
    } catch (error) {
      setBanLoading(false)
      openNotification('error', error.response.data.message, 3, 'red');
    }
  }

  const DeleteUser=async(id)=>{
    setDeleteLoading(true)
    try {
      const res = await axios.get(`${BACKENDURL}/users/delete?id=${id}`);
      setDeleteLoading(false)
      reload()
      openNotification('success', res.data.message, 3, 'green');
    } catch (error) {
      setDeleteLoading(false)
      openNotification('error', error.response.data.message, 3, 'red');
    }
  }

  const columns = [
    {
      title: 'User Info',
      fixed: 'left',
      children: [
        {
          title: 'IDNO',
          dataIndex: 'employee',
          render:r=>r.employee.IDNO?<Link to={`/employee/detail/${r.employee.IDNO}`}>{r.employee.IDNO}</Link>:"N/A",
          width:'80px',
        },
        {
          title: 'UserName',
          dataIndex: 'userName',
          key: 'userName',
          width:"250px"
        },
        {
          title: 'Sex',
          dataIndex: 'employee',
          render:r=>r.employee.sex?r.employee.sex:'N/A',
          width:'80px'
        },
      ],
    },
    {
      title: 'Contact Information',
      children: [
        {
          title: 'Phone',
          dataIndex: 'employee',
          render:r=>r.employee.contact.phone?r.employee.contact.phone:'N/A',
          width:'100px',
          },
          {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            width:'250px'
          },
        ],
      },
      {
        title: 'Access',
        dataIndex: 'access',
        width:'80px',
        key: 'access',
        render:r=>(<Tag color={r==='Full'?"green":r==="RW"?'gold':'processing'}>{r}</Tag>)
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
     <Button style={{padding:2,margin:0}} type='text' disabled={banLoading} loading={banLoading}><FaUserLock onClick={()=>BanUser({id:r.IDNO,status:r.status==="Active"?"InActive":"Active"})}/></Button>
     <Popconfirm title='Are you sure, Delete user' onConfirm={()=>DeleteUser(r.IDNO)}><Button type='text' disabled={deleteLoading} loading={deleteLoading}><MdDelete color='red'/></Button></Popconfirm>
     </Space>
    },
  ];


  return (
    <>
    <ModalForm
          open={modalOpen}
          close={() => setModalOpen (false)}
          title={<Divider>Update User Form</Divider>}
          content={<UpdateUserForm id={modalContent} reload={()=>reload()} openModalFun={(e) => setModalOpen (e)}/>}
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
      dataSource={userData}
      loading={loading}
    />
    </>
  );
};
export default UserTable;
