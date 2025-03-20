import {Button, Divider, Form, Input, Select} from 'antd';
import axios from 'axios';
import React, {useContext, useState} from 'react';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL} from '../../../helper/Urls';

const GenerateExcelReport = ({
  openModalFun,
  fieldOptionData,
  reportEndPoint,
  loadingFieldOptionData,
}) => {
  const {openNotification} = useContext (AlertContext);
  const [loading, setLoading] = useState (false);
  const [form] = Form.useForm ();

  const operationOptions=[
    {value:'Equal',lable:'='},
    {value:'Greater',lable:'>'},
    {value:'Less',lable:"<"},
    {value:'Not Equal',lable:'!='},
  ]
  const [filterRules, setfilterRules] = useState ([
    {
      field: '',
      operation: '',
      value: '',
    },
  ]);

  const handleAdd = () => {
    setfilterRules ([
      ...filterRules,
      {
        field: '',
        operation: '',
        value: '',
      },
    ]);
  };

  const handleRemove = index => {
    setfilterRules (filterRules.filter ((_, i) => i !== index));
  };

  const onFinish = async values => {
    setLoading (true);
    try {
      const res = await axios.post (`${BACKENDURL}${reportEndPoint}`, {
        selectedField: values.selectedField,
        filterRules: filterRules,
      });
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
          style={{margin: '5px 0', width: '100%'}}
          label="Field To Show"
          rules={[
            {
              required: true,
              message: 'Please input field',
            },
          ]}
          name="selectedField"
        >
          <Select
            placeholder="Search to Select"
            mode="multiple"
            maxTagCount="responsive"
            options={fieldOptionData}
            loading={loadingFieldOptionData}
            disabled={loadingFieldOptionData}
          />
        </Form.Item>
        <Divider>Filter Rule</Divider>
        {filterRules.map ((filters, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              width: '100%',
              borderBottom: '1px solid gray',
              padding: '5px 0',
            }}
          >
            <Form.Item
              style={{margin: '0', width: '33%'}}
              label={`Field ${index + 1}`}
              rules={[{required: true, message: 'Field Name Required'}]}
            >
              <Select
                placeholder="Field"
                onChange={e => {
                  const value = e;
                  setfilterRules (prev => {
                    const updatedRules = [...prev];
                    updatedRules[index].field = value;
                    return updatedRules;
                  });
                }}
                options={fieldOptionData}
                loading={loadingFieldOptionData}
                disabled={loadingFieldOptionData}
              />
            </Form.Item>
            <Form.Item
              style={{margin: '0', width: '33%'}}
              label={`Operation ${index + 1}`}
              rules={[{required: true, message: 'Operation Name Required'}]}
            >
              <Select
                placeholder="Operation"
                onChange={e => {
                  const value = e;
                  setfilterRules (prev => {
                    const updatedRules = [...prev];
                    updatedRules[index].operation = value;
                    return updatedRules;
                  });
                }}
                options={operationOptions}
              />
            </Form.Item>
            <Form.Item
              style={{margin: '0', width: '33%'}}
              label={`Value ${index + 1}`}
              rules={[{required: true, message: 'Value Required'}]}
            >
              <Input
                placeholder="value"
                value={filters.value}
                onChange={e => {
                  const value = e.target.value;
                  setfilterRules (prev => {
                    const updatedRules = [...prev];
                    updatedRules[index].value = value;
                    return updatedRules;
                  });
                }}
              />
            </Form.Item>
            {index > 0 &&
              <Button
                style={{marginTop: '5px'}}
                onClick={() => handleRemove (index)}
              >
                Remove
              </Button>}
          </div>
        ))}
        <Button style={{margin: '10px 0'}} type="primary" onClick={handleAdd}>
          Add Rules
        </Button>

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
          Generate
        </Button>
      </Form.Item>
    </Form>
  );
};

export default GenerateExcelReport;
