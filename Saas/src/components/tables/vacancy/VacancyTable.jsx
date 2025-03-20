import React, {useContext, useRef, useState} from 'react';
import {
  Button,
  Divider,
  Input,
  Popconfirm,
  Space,
  Tooltip,
  Table,
  Tag,
} from 'antd';
import {SearchOutlined} from '@ant-design/icons';
import {FaUsers} from 'react-icons/fa6';
import { MdEdit} from 'react-icons/md';
import {FormatDateTime} from '../../../helper/FormatDate';
import ModalForm from '../../../modal/Modal';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL} from '../../../helper/Urls';
import axios from 'axios';
import {IoMdEyeOff} from 'react-icons/io';
import UpdateVancayForm from '../../forms/vacancy/UpdateVacancyForm';
import {Link} from 'react-router-dom';
import {FormatDay} from '../../../helper/FormateDay';

const VacancyTable = ({vacancyData, loading, reload}) => {
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

  const CloseVacancy = async id => {
    setBanLoading (true);
    try {
      const res = await axios.get (`${BACKENDURL}/vacancy/close?id=${id}`);
      openNotification ('success', res.data.message, 3, 'green');
      reload ();
      setBanLoading (false);
    } catch (error) {
      setBanLoading (false);
      openNotification ('error', error.response.data.message, 3, 'red');
    }
  };

  const columns = [
    {
      title: 'IDNO',
      dataIndex: 'IDNO',
      ...getColumnSearchProps ('IDNO'),
      width: '80px',
      key: 'IDNO',
    },
    {
      title: 'Title',
      dataIndex: 'title',
      ...getColumnSearchProps ('title'),
      width: '200px',
      key: 'title',
    },
    {
      title: 'Branch',
      dataIndex: 'branch',
      ...getColumnSearchProps ('branch'),
      width: '100px',
      key: 'branch',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      ...getColumnSearchProps ('department'),
      width: '110px',
      key: 'department',
    },
    {
      title: 'Position',
      dataIndex: 'position',
      ...getColumnSearchProps ('position'),
      width: '100px',
      key: 'position',
    },
    {
      title: 'Vacancy Type',
      dataIndex: 'vacancyType',
      ...getColumnSearchProps ('vacancyType'),
      key: 'type',
      width: '140px',
    },
    {
      title: 'Employement Type',
      dataIndex: 'employementType',
      ...getColumnSearchProps ('employementType'),
      key: 'type',
      width: '160px',
    },
    {
      title: 'Sector',
      dataIndex: 'sector',
      key: 'sector',
      width: '120px',
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      width: '100px',
    },
    {
      title: 'Experience',
      dataIndex: 'experience',
      key: 'experience',
      width: '100px',
    },
    {
      title: 'Vacancy',
      dataIndex: 'vacancyNo',
      key: 'vacancyNo',
      width: '100px',
    },

    {
      title: 'Salary',
      dataIndex: 'salary',
      key: 'salary',
      width: '150px',
    },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      render: r => <span>{FormatDay (r)}</span>,
      width: '120px',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      width: '160px',
      key: 'createdAt',
      render: r => <span>{FormatDateTime (r)}</span>,
    },
    {
      fixed: 'right',
      title: 'Status',
      width: '80px',
      key: 'status',
      render: r => (
        <Tag color={r.status === 'Open' ? 'success' : 'volcano'}>
          {r.status}
        </Tag>
      ),
    },
    {
      title: 'Action',
      width: '100px',
      fixed: 'right',
      key: 'operation',
      render: r => (
        <Space
          style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap'}}
        >
          <Tooltip title="Update">
              <Button
                style={{padding: '0', margin: '0'}}
                type="text"
                onClick={() => {
                  setModalOpen (true);
                  setModalContent (r.IDNO);
                }}
              >
                <MdEdit />
              </Button>
          </Tooltip>
          <Tooltip title="Close">
            <Popconfirm title='Are you sure, Close Vacancy' onConfirm={() => CloseVacancy (r.IDNO)}>

            <Button style={{padding: '0', margin: '0'}} type="text">
              <IoMdEyeOff />
            </Button>
            </Popconfirm>
            </Tooltip>
          <Tooltip title="Applicants">
            <Link to={`/vacancy/applicants/${r.id}`}>
              <FaUsers />
            </Link>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <ModalForm
        open={modalOpen}
        close={() => setModalOpen (false)}
        title={<Divider>Update Vacancy</Divider>}
        content={
          <UpdateVancayForm
            id={modalContent}
            reload={() => reload ()}
            openModalFun={e => setModalOpen (e)}
          />
        }
      />
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
        dataSource={vacancyData}
        loading={loading}
      />
    </div>
  );
};
export default VacancyTable;
