import {Button, Form, Select} from 'antd';
import React, { useContext, useEffect, useState } from 'react';
import { BACKENDURL } from '../../../helper/Urls';
import axios from 'axios';
import { AlertContext } from '../../../context/AlertContext';

const FiterTimeSheet = ({reload,loading}) => {
  const [form] = Form.useForm ();
  const {openNotification} = useContext(AlertContext);

  const onFinish = async values => {
      reload ({
        month: values.month,
        site: values.site,
        type: values.employeementType,
      });
  };

  const onFinishFailed = errorInfo => {
    console.log ('Failed:', errorInfo);
  };

  
  const [siteData, setsiteData] = useState ([]);
  const [loadingSite, setLoadingSite] = useState (false);

  const getSiteData = async () => {
    setLoadingSite (true);
    try {
      const res = await axios.get (`${BACKENDURL}/project/all`);
      setLoadingSite (false);
      setsiteData (res.data.projects);
      console.log(res.data.projects)
    } catch (error) {
      openNotification ('error', error.response.data.message, 3, 'red');
      setLoadingSite (false);
    }
  };

  const siteOptions = siteData
    ? siteData.map (d => ({
        value: d.site,
        label: d.site,
      }))
    : [];

  useEffect(() => {
    getSiteData ();
  }, []);

  return (
    <Form
      layout="vertical"
      onFinish={onFinish}
      form={form}
      style={{display: 'flex'}}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item
        name="month"
        style={{margin: '5px', width: '200px'}}
        rules={[
          {
            required: true,
            message: 'Select Month',
          },
        ]}
      >
        <Select
          placeholder="Select Month"
          options={Array (12).fill ('1').map ((_, i) => ({
            value: i + 1,
            label: i + 1,
          }))}
        />
      </Form.Item>
      <Form.Item
        name="site"
        style={{margin: '5px', width: '200px'}}
        rules={[
          {
            required: true,
            message: 'Select Site',
          },
        ]}
      >
        <Select
          placeholder="Select Site"
          options={siteOptions}
          disabled={loadingSite}
          loading={loadingSite}
        />
      </Form.Item>
      <Form.Item
        style={{margin: '5px', width: '200px'}}
        name="type"
        rules={[
          {
            required: true,
            message: 'Select Type',
          },
        ]}
      >
        <Select
          placeholder="Select Type"
          options={[
            {
              value: 'Permanent',
              label: 'Permanent',
            },
            {
              value: 'Temporary',
              label: 'Temporary',
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

export default FiterTimeSheet;
