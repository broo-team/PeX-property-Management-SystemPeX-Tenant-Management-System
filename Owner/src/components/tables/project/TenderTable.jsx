import React from 'react';
import { Table, Tag } from 'antd';
import { BACKENDURL } from '../../../helper/Urls';
import { FormatDay } from '../../../helper/FormateDay';


const TenderTable = ({ datas, loading }) => {

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (text) => FormatDay(text),
    },
    {
      title: 'Starting Date',
      dataIndex: 'startingDate',
      key: 'startingDate',
      render: (text) => FormatDay(text),
    },
    {
      title: 'Budget Per Employee',
      dataIndex: 'budget',
      key: 'budget',
    },
    {
      title: 'Company Name',
      dataIndex: 'companyName',
      key: 'companyName',
    },
    
    {
      title: 'Attachments',
      dataIndex: 'attachments',
      key: 'attachments',
      render: (attachments) => (
              <a href={`${BACKENDURL}/uploads/new/${attachments}`} target="_blank" >
                View
              </a>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'status',
      render: (r) => (
        <Tag color={r==='Pending'?"processing":r==='Failed'?'volcano':'success'}>{r}</Tag>
      ),
    },
  ];

  return (
          <Table dataSource={datas} loading={loading} columns={columns}/>
  );
};

export default TenderTable;