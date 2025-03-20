import {Button, Form, Input, Select} from 'antd';
import axios from 'axios';
import React, {useContext, useState} from 'react';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL} from '../../../helper/Urls';

const FilterIncomeTax = ({openModalFun, reload,onFilterChange}) => {
  const {openNotification} = useContext (AlertContext);
  const [loading, setLoading] = useState (false);
  const [form] = Form.useForm ();

  const onFinish = async values => {
    onFilterChange()
    
  };
  const onFinishFailed = errorInfo => {
    console.log ('Failed:', errorInfo);
  };

  return (
    <Form
      layout="vertical"
      onFinish={onFinish}
      form={form}
      style={{display: 'flex'}}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item
        style={{margin: '5px', width: '200px'}}
        rules={[
          {
            required: true,
            message: 'Select Month',
          },
        ]}
        name="selectMonth"
      >
        <Select
          placeholder="Select Month"
          options={[
            {
              value: 'Jun',
              label: 'Jun',
            },
            {
              value: 'Jul',
              label: 'Jul',
            },
            {
              value: 'Aug',
              label: 'Aug',
            },
            {
              value: 'Sept',
              label: 'Sept',
            },
          ]}
        />
      </Form.Item>

      <Form.Item
        name="site"
        style={{margin: '5px', width: '200px'}}
        rules={[
          {
            message: 'Select Site',
          },
        ]}
      >
        <Select
          placeholder="Select Site"
          options={[
            {
              value: 'Addis Abeba Yeka',
              label: 'Addis Abeba Yeka',
            },
            {
              value: 'Arada Buna Bank',
              label: 'Arada Buna Bank',
            },
            {
              value: 'Addis Abeba Saris',
              label: 'Addis Abeba Saris',
            },
            {
              value: 'Bahir Dar CBE',
              label: 'Bahir Dar CBE',
            },
          ]}
        />
      </Form.Item>
      <Form.Item
        style={{margin: '5px', width: '200px'}}
        name="city"
        rules={[
          {
            message: 'Select City / Region',
          },
        ]}
      >
        <Select
          placeholder="Select City / Region"
          options={[
            {
              value: 'Addis Abeba',
              label: 'Addis Abeba',
            },
            {
              value: 'Amhara',
              label: 'Amhara',
            },
            {
              value: 'Sidama',
              label: 'Sidama',
            },
          ]}
        />
      </Form.Item>

      <Form.Item
        style={{margin: '5px', width: '200px'}}
        name="subcity"
        rules={[
          {
            message: 'Select SubCity / Zone',
          },
        ]}
      >
        <Select
          placeholder="Select SubCity / Zone"
          options={[
            {
              value: 'Yeka',
              label: 'Yeka',
            },
            {
              value: 'North Shewa',
              label: 'North Shewa',
            },
            {
              value: 'South Shewa',
              label: 'South Shewa',
            },
          ]}
        />
      </Form.Item>


      <Form.Item
        style={{margin: '5px', width: '200px'}}
        name="wereda"
        rules={[
          {
            message: 'Select Wereda',
          },
        ]}
      >
        <Select
          placeholder="Select Wereda"
          options={[
            {
              value: '07',
              label: '07',
            },
            {
              value: '08',
              label: '08',
            },
          ]}
        />
      </Form.Item>

      <Form.Item style={{margin: '5px'}}>
        <Button
          type="primary"
          htmlType="submit"
          disabled={loading}
          loading={loading}
        >
          Filter
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FilterIncomeTax;
