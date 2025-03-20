import {Button, DatePicker, Form} from 'antd';
import React from 'react';

const FilterBalance = ({reload,loading}) => {
  const [form] = Form.useForm ();

  const onFinish = async values => {
      reload ({
        year: values.year,
      });
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
        name="year"
        style={{margin: '5px 0', width: '150px'}}
        rules={[
          {
            required: true,
            message: 'Select Year',
          },
        ]}
      >
        <DatePicker picker='year' style={{width:'100%'}}/>
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

export default FilterBalance;
