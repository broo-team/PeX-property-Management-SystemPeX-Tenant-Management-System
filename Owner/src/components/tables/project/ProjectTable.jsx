import React, { useRef, useState } from 'react';
import { Table, Button, Modal, Form, Input, Upload, message, Space } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { FormatDay } from '../../../helper/FormateDay';
import {SearchOutlined} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import EditProjectForm from '../../forms/project/EditProjectForm';
import ModalForm from '../../../modal/Modal';

const ProjectTable = ({ loading, datas, setProjectData }) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  const [modalOpen, setModalOpen] = useState (false);
  const [modalContent, setModalContent] = useState ([]);
  const [modalTitle, setModalTitle] = useState ('');

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
      title: 'Company',
      dataIndex: 'company',
      key: 'company',
      ...getColumnSearchProps('company'),
    },
    {
      title: 'City',
      dataIndex: 'city',
      ...getColumnSearchProps('city'),
      key: 'city',
    },
    {
      title: 'Sub City',
      ...getColumnSearchProps('subCity'),
      dataIndex: 'subCity',
      key: 'subCity',
    },
    {
      title: 'Site',
      dataIndex: 'site',
      ...getColumnSearchProps('site'),
      key: 'site',
    },
    {
      title: 'Number of Security',
      dataIndex: 'noSecurity',
      key: 'noSecurity',
    },
    {
      title: 'From',
      dataIndex: 'startDate',
      key: 'startDate',
      render:r=>FormatDay(r)
    },
    {
      title: 'To',
      dataIndex: 'endDate',
      key: 'endDate',
      render:r=>FormatDay(r)
    },
    {
      title: 'OT Price Rate',
      dataIndex: 'price',
      key: 'price',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Space>
          <Button type="primary" onClick={() => {setModalOpen (true);setModalContent(<EditProjectForm id={record.id}  reload={()=>setProjectData()} openModalFun={(e) => setModalOpen (e)}/>);setModalTitle('Edit Project Form')}}>
          Edit
        </Button>
          <Link type="primary" to={`${record.id}`}>
            Details
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <>
    <ModalForm
          open={modalOpen}
          close={() => setModalOpen (false)}
          title={modalTitle}
          content={modalContent}
        />
      <Table
        columns={columns}
        size='small'
        dataSource={datas}
        loading={loading}
        rowKey="id"
        scroll={{
          x: 500,
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
      />
    </>
  );
};

export default ProjectTable;