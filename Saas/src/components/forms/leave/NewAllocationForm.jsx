import {Button, DatePicker, Form, Input, InputNumber, Select} from 'antd';
import axios from 'axios';
import React, {useContext, useState} from 'react';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL} from '../../../helper/Urls';

const NewAllocationForm = ({openModalFun, reload}) => {
  const {openNotification} = useContext (AlertContext);
  const [loading, setLoading] = useState (false);
  const [form] = Form.useForm ();

  const onFinish = async values => {
    setLoading (true);
    console.log(values)
    try {
      const res = await axios.post (`${BACKENDURL}/leave/newallocation`, {
        count: values.count,
        startMonth: values.startMonth,
        endMonth: values.endMonth,
      });
      reload ();
      setLoading (false);
      openModalFun (false);
      openNotification ('success', res.data.message, 3, 'green');
      form.resetFields ();
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

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >

        <Form.Item
          style={{margin: '5px 0', width: '49%'}}
          label="Start Month"
          name="startMonth"
          rules={[
            {
              required: true,
              message: 'Please input Start',
            },
          ]}
        >
          <DatePicker style={{width: '100%'}} picker='month'/>
        </Form.Item>

        <Form.Item
          style={{margin: '5px 0', width: '49%'}}
          label="End Month"
          name="endMonth"
          rules={[
            {
              message: 'Please input End',
            },
          ]}
        >
          <DatePicker style={{width: '100%'}} picker='month'/>
        </Form.Item>

      </div>
      <Form.Item
        style={{margin: '5px 0',width:'100%'}}
        label="Count"
        rules={[
          {
            required: true,
            message: 'Please input count',
          },
        ]}
        name="count"
      >
        <InputNumber style={{width:'100%'}}/>
      </Form.Item>

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

export default NewAllocationForm;
