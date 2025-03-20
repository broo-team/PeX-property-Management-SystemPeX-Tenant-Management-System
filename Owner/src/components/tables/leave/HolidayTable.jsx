import React, {useContext, useRef, useState} from 'react';
import {
  Button,
  Input,
  Popconfirm,
  Space,
  Table,
} from 'antd';
import {SearchOutlined} from '@ant-design/icons';
import {MdDelete, MdEdit} from 'react-icons/md';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL} from '../../../helper/Urls';
import axios from 'axios';
import { FormatDay } from '../../../helper/FormateDay';

const HolidayTable = ({holidayData, loading, reload}) => {
  const {openNotification} = useContext (AlertContext);
  const [searchedColumn, setSearchedColumn] = useState ('');
  const [searchText, setSearchText] = useState ('');
  const searchInput = useRef (null);
  const [modalOpen, setModalOpen] = useState (false);
  const [modalContent, setModalContent] = useState ([]);
  const [banLoading, setBanLoading] = useState (false);
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

  const BanUser = async ({id, status}) => {
    setBanLoading (true);
    try {
      const res = await axios.get (
        `${BACKENDURL}/users/ban?id=${id}&&status=${status}`
      );
      openNotification ('success', res.data.message, 3, 'green');
      reload ();
      setBanLoading (false);
    } catch (error) {
      setBanLoading (false);
      openNotification ('error', error.response.data.message, 3, 'red');
    }
  };

  const DeleteHoliday = async id => {
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
      title: 'Holiday Name',
      dataIndex: 'name',
      ...getColumnSearchProps ('name'),
      key: 'name',
      width: '150px',
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      width: '100px',
      key: 'startDate',
      render: r => <span>{FormatDay(r)}</span>,
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      width: '100px',
      key: 'endDate',
      render: r => <span>{FormatDay(r)}</span>,
    },
    {
      title: 'Total Days',
      dataIndex: 'totalDay',
      width: '100px',
      key: 'totalDay',
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
            title="Are you sure, Delete Holiday"
            onConfirm={() => DeleteHoliday (r.IDNO)}
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
      dataSource={holidayData}
      loading={loading}
    />
  );
};
export default HolidayTable;
