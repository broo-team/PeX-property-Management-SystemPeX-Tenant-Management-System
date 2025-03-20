import {Button, Form, Input, Select} from 'antd';
import axios from 'axios';
import React, {useContext, useState} from 'react';
import { AlertContext } from '../../../context/AlertContext';
import { BACKENDURL } from '../../../helper/Urls';

const NewHolidayForm = ({openModalFun,reload}) => {
  const {openNotification} = useContext (AlertContext);
  const [loading, setLoading] = useState (false);
  const [form] = Form.useForm();

  const onFinish = async values => {
    setLoading (true);
    try {
      const res = await axios.post (`${BACKENDURL}/leave/newholiday`,{
        name: values.name,
        startDate: values.startDate+ "T00:00:00Z",
        endDate: values.endDate+ "T00:00:00Z",
      });
      reload()
      setLoading (false);
      openModalFun(false)
      openNotification ('success', res.data.message, 3, 'green');
      form.resetFields()
    } catch (error) {
      setLoading (false);
      openNotification ('error', error.response.data.message, 3, 'red');
    }
  };
  const onFinishFailed = errorInfo => {
    console.log ('Failed:', errorInfo);
  };

  return (
    <Form
      layout="vertical"
      onFinish={onFinish}
      form={form}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item
        style={{margin: '5px'}}
        label="Holiday Name"
        rules={[
          {
            required: true,
            message: 'Please input Name',
          },
        ]}
        name="name"
      >
        <Input />
      </Form.Item>

      <div style={{display: 'flex', justifyContent: 'space-between',flexWrap:'wrap'}}>

      <Form.Item
          style={{margin: '5px', width: '47%'}}
          label="Start Date"
          name="startDate"
          rules={[
            {
              required: true,
              message: 'Please input Start',
            },
          ]}
        >
          <Input type='date'/>
        </Form.Item>

        <Form.Item
          style={{margin: '5px', width: '47%'}}
          label="End Date"
          name="endDate"
          rules={[
            {
              required: true,
              message: 'Please input End',
            },
          ]}
        >
          <Input type='date'/>
        </Form.Item>

      </div>
      <Form.Item
        style={{display: 'flex', justifyContent: 'center', marginTop: '15px'}}
      >
        <Button
          type="primary"
          htmlType="submit"
          disabled={loading}
          loading={loading}
        >
          Register
        </Button>
      </Form.Item>
    </Form>
  );
};

export default NewHolidayForm;
