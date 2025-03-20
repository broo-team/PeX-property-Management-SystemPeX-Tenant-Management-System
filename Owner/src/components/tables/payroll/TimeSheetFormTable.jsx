import React, {useRef, useState} from 'react';
import {SearchOutlined} from '@ant-design/icons';
import {Space, Button, Input, Popconfirm, Table, Divider, Tag, Tooltip} from 'antd';
import {MdDelete, MdEdit} from 'react-icons/md';
import {FaCheck} from 'react-icons/fa6';
import UpdateTimeSheetForm from '../../forms/attendance/UpdateTimeSheetForm';
import ModalForm from '../../../modal/Modal';
import { Link } from 'react-router-dom';

const TimeSheetFormTable = ({timesheetData, reload}) => {
  const [searchedColumn, setSearchedColumn] = useState ('');
  const [searchText, setSearchText] = useState ('');
  const searchInput = useRef (null);
  const [modalOpen, setModalOpen] = useState (false);
  const [modalContent, setModalContent] = useState ([]);

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

  const columns = [
    {
      title: 'IDNO',
      fixed: 'left',
      dataIndex: 'IDNO',
      ...getColumnSearchProps ('IDNO'),
      width: '130px',
      key: 'IDNO',
      render: r => (
        <Tooltip title="View Detail">
          <Link to={`/employee/detail/${r}`}>
            {r}
          </Link>
        </Tooltip>
      ),
    },
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
      title: 'Regular Place Hour',
      dataIndex: 'regularPH',
      key: 'regularPH',
      width: '80px',
    },
    {
      title: '32 Over Time',
      dataIndex: 'OT32',
      key: 'OT32',
      width: '80px',
    },

    {
      title: 'Regular Place OT Hour',
      dataIndex: 'regularPOTH',
      key: 'regularPOTH',
      width: '80px',
    },
    {
      title: 'Total Hour',
      dataIndex: 'totalHours',
      width: '80px',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: '60px',
      render: r => (
        <Tag
          color={
            r === 'Pending'
              ? 'processing'
              : r === 'Approved' ? 'success' : 'volcano'
          }
        >
          {r}
        </Tag>
      ),
    },
    {
      title: 'operation',
      width: '120px',
      render: r => (
        <Space
          style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap'}}
        >
          <Button
            onClick={() => {
              setModalOpen (true);
              setModalContent (r.id);
            }}
          >
            <MdEdit />
          </Button>

          <Button>
            <FaCheck color="green" />
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>

      <ModalForm
        open={modalOpen}
        close={() => setModalOpen (false)}
        title={<Divider>TimeSheet Form</Divider>}
        content={
          <UpdateTimeSheetForm
            id={modalContent}
            reload={() => reload ()}
            openModalFun={e => setModalOpen (e)}
          />
        }
      />

      <Table
        bordered
        dataSource={timesheetData}
        columns={columns}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          position: ['topRight'],
        }}
      />
    </div>
  );
};
export default TimeSheetFormTable;
