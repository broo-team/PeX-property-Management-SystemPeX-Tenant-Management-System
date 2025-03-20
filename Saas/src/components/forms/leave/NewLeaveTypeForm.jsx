import {Button, Form, Input, Select} from 'antd';
import axios from 'axios';
import React, {useContext, useState} from 'react';
import { AlertContext } from '../../../context/AlertContext';
import { BACKENDURL } from '../../../helper/Urls';

const NewLeaveTypeForm = ({openModalFun,reload}) => {
  const {openNotification} = useContext (AlertContext);
  const [loading, setLoading] = useState (false);
  const [form] = Form.useForm();

  const onFinish = async values => {
    setLoading (true);
    try {
      const res = await axios.post (`${BACKENDURL}/leave/newtype`,{
        name:values.name, maxLeaveDate:values.maxLeaveDate, applicableAfter:values.applicableAfter, repeat:values.repeat, withPay:values.withPay,
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
        label="Leave Name"
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
          label="Max Leave Day"
          name="maxLeaveDate"
          rules={[
            {
              required: true,
              message: 'Please input Max Leave day',
            },
          ]}
        >
          <Input type='number'/>
        </Form.Item>

        <Form.Item
          style={{margin: '5px', width: '47%'}}
          label="Repeat	"
          name="repeat"
          rules={[
            {
              required: true,
              message: 'Please input Repeat	',
            },
          ]}
        >
          <Input type='number'/>
        </Form.Item>
        
        <Form.Item
          style={{margin: '5px', width: '47%'}}
          label="Applicable After (Working Day)"
          rules={[
            {
              required: true,
              message: 'Please input Applicable After',
            },
          ]}
          name="applicableAfter"
        >
          <Input type='number'/>
        </Form.Item>

        <Form.Item
          style={{margin: '5px', width: '47%'}}
          label="WIth Pay"
          rules={[
            {
              required: true,
              message: 'Please input With Pay',
            },
          ]}
          name="withPay"
        >
          <Select
            showSearch
            placeholder="Search to Select"
            optionFilterProp="children"
            filterOption={(input, option) => (option?.label ?? '').includes(input)}
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
            }
            options={[
              {
                value: 'Yes',
                label: 'Yes',
              },
              {
                value: 'No',
                label: 'No',
              },
              {
                value: 'Other',
                label: 'Other',
              },
            ]}
          />
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

export default NewLeaveTypeForm;
