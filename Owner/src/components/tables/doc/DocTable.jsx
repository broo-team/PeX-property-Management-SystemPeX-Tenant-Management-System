import React, {useContext, useRef, useState} from 'react';
import {
  Button,
  Input,
  Popconfirm,
  Space,
  Table,
  Tooltip,
} from 'antd';
import {SearchOutlined} from '@ant-design/icons';
import { MdEdit} from 'react-icons/md';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL} from '../../../helper/Urls';
import axios from 'axios';
import { IoEyeOff } from 'react-icons/io5';
import { FormatDay } from '../../../helper/FormateDay';

const DocTable = ({data, loading, reload}) => {
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

  const DeleteUser = async id => {
    setDeleteLoading (true);
    try {
      // const res = await axios.get (`${BACKENDURL}/users/delete?id=${id}`);
      setDeleteLoading (false);
      reload ();
      openNotification ('success','Under Work tho', 3, 'green');
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
      key: 'IDNO',
      width: '100px',
    },
    {
      title: 'Doc Ref',
      dataIndex: 'docRef',
      ...getColumnSearchProps ('docRef'),
      key: 'docRef',
      width: '100px',
    },
    {
      title: 'Doc Name',
      dataIndex: 'name',
      ...getColumnSearchProps ('name'),
      key: 'name',
      width: '200px',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      ...getColumnSearchProps ('type'),
      render:r=>r?r.name:'N/A',
      key: 'type',
      width: '150px',
    },
    {
      title: 'Author',
      dataIndex: 'author',
      ...getColumnSearchProps ('author'),
      key: 'author',
      width: '150px',
    },
    {
      title: 'Attachment',
      dataIndex: 'attachment',
      key: 'attachment',
      render:r=><a target='_blank' href={`${BACKENDURL}/uploads/new/${r}`}>View</a>,
      width: '150px',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      width:'150px',
      key: 'createdAt',
      render:r=>(<span>{FormatDay(r)}</span>)
    },
    {
      title: 'Last Modified',
      dataIndex: 'updatedAt',
      width:'150px',
      key: 'updatedAt',
      render:r=>(<span>{FormatDay(r)}</span>)
    },
    {
      title: 'Action',
      width: '120px',
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
            title="Are you sure, Change Status"
            onConfirm={() => DeleteUser (r.IDNO)}
          >
            <Tooltip title='Change Status'>
            <Button
              type="text"
              disabled={deleteLoading}
              loading={deleteLoading}
            >
              <IoEyeOff color="red" />
            </Button>
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      size="small"
      bordered
      columns={columns}
      scroll={{
        x: 500,
      }}
      pagination={{
        defaultPageSize: 7,
        showSizeChanger: false,
      }}
      dataSource={data}
      loading={loading}
    />
  );
};
export default DocTable;
