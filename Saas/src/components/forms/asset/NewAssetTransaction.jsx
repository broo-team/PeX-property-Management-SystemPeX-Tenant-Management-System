import {Button, Form, Input, Select} from 'antd';
import axios from 'axios';
import React, {useContext, useEffect, useState} from 'react';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL} from '../../../helper/Urls';

const NewAssetTransaction = ({openModalFun, reload}) => {
  const {openNotification} = useContext (AlertContext);
  const [loading, setLoading] = useState (false);
  const [form] = Form.useForm ();

  const [categoryData, setcategoryData] = useState ([]);
  const [loadingcategory, setLoadingcategory] = useState (false);

  const getcategoryData = async () => {
    setLoadingcategory (true);
    try {
      const res = await axios.get (`${BACKENDURL}/asset/store/catall`);
      setLoadingcategory (false);
      setcategoryData (res.data.categorys);
    } catch (error) {
      openNotification ('error', error.response.data.message, 3, 'red');
      setLoadingcategory (false);
    }
  };

  const categoryOptions = categoryData.length
    ? categoryData.map (category => ({
        value: category.id,
        label: category.name,
      }))
    : [];

  useEffect (() => {
    getcategoryData ();
  }, []);

  const onFinish = async values => {
    setLoading (true);
    try {
      const res = await axios.post (`${BACKENDURL}/asset/transaction/catnew`, {
        name: values.name,
        description: values.description,
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
          style={{margin: '0', width: '100%'}}
          label="Category"
          name="category"
          rules={[
            {
              required: true,
              message: 'Please input Category',
            },
          ]}
        >
          <Select
            placeholder="Search to Select"
            showSearch
            filterOption={(input, option) =>
              option.label.toLowerCase ().includes (input.toLowerCase ())}
            options={categoryOptions}
            loading={loadingcategory}
            disabled={loadingcategory}
          />
        </Form.Item>

        <Form.Item
          style={{margin: '0', width: '100%'}}
          label="Items"
          name="items"
          rules={[
            {
              required: true,
              message: 'Please input Category',
            },
          ]}
        >
          <Select
            placeholder="Search to Select"
            options={categoryOptions}
            loading={loadingcategory}
            showSearch
            filterOption={(input, option) =>
              option.label.toLowerCase ().includes (input.toLowerCase ())}
            mode="multiple"
            maxTagCount="responsive"
            disabled={loadingcategory}
          />
        </Form.Item>

        <Form.Item
          style={{margin: '0', width: '40%'}}
          label="Quantity"
          name="quantity"
          rules={[
            {
              required: true,
              message: 'Please input Quantity',
              type: 'number',
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          style={{margin: '0', width: '59%'}}
          label="Type"
          name="type"
          rules={[
            {
              required: true,
              message: 'Please input Type',
            },
          ]}
        >
          <Select
            placeholder="Select Type"
            options={[
              {
                value: 'Request',
                label: 'Request',
              },
              {
                value: 'Return',
                label: 'Return',
              },
            ]}
            showSearch
            filterOption={(input, option) =>
              option.label.toLowerCase ().includes (input.toLowerCase ())}
          />
        </Form.Item>

        <Form.Item
          style={{margin: '5px', width: '100%'}}
          label="Employee"
          name="employee"
          rules={[
            {
              required: true,
              message: 'Please input Employee',
            },
          ]}
        >
          <Select
            placeholder="Search to Select"
            options={categoryOptions}
            loading={loadingcategory}
            mode="multiple"
            maxTagCount="responsive"
            showSearch
            filterOption={(input, option) =>
              option.label.toLowerCase ().includes (input.toLowerCase ())}
            disabled={loadingcategory}
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

export default NewAssetTransaction;
