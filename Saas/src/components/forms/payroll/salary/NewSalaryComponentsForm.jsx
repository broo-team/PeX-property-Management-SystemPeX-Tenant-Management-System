import {Button, Form, Input, InputNumber, Select} from 'antd';
import axios from 'axios';
import React, {useContext, useState} from 'react';
import {AlertContext} from '../../../../context/AlertContext';
import {BACKENDURL} from '../../../../helper/Urls';
import TextArea from 'antd/es/input/TextArea';

const NewSalaryComponentsForm = ({openModalFun, reload}) => {
  const {openNotification} = useContext (AlertContext);
  const [loading, setLoading] = useState (false);
  const [TaxType, setTaxType] = useState ('');
  const [componetType, setComponentType] = useState ('');
  const [semiTaxType, setSemiTaxType] = useState ('');
  const [conditionType, setConditionType] = useState ('');
  const [form] = Form.useForm ();

  const onFinish = async values => {
    setLoading (true);
    try {
      const res = await axios.post (
        `${BACKENDURL}/salary/components/new`,
        {
          name: values.name,
          type: values.componentType,
          pension:componetType==="Earning"?values.pensionType:"No",
          tax:componetType==="Earning"?values.taxType:"No",
          semiTaxType:TaxType==="Semi"?values.semiTaxType:"None",
          minNonTaxable:TaxType==="Semi"?values.minNonTaxable:"0",
          applicableAfter: values.applicableAfter,
          conditionType: values.conditionType,
        }
      );
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
      <div style={{display: 'flex', flexWrap: 'wrap', width: '100%'}}>
        <Form.Item
          label="Name"
          style={{margin: '5px', width: '48%'}}
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
        <Form.Item
          label="Component Type"
          style={{margin: '5px', width: '47%'}}
          rules={[
            {
              required: true,
              message: 'Component Type?',
            },
          ]}
          name="componentType"
        >
          <Select
            showSearch
            placeholder="Search to Select"
            onChange={e => setComponentType (e)}
            optionFilterProp="children"
            options={[
              {
                value: 'Earning',
                label: 'Earning',
              },
              {
                value: 'Deduction',
                label: 'Deduction',
              },
            ]}
          />
        </Form.Item>
        {componetType==="Earning"&&<>
          <Form.Item
          style={{margin: '5px', width: '48%'}}
          label="Is Tax Allowed"
          rules={[
            {
              required: true,
              message: 'Is Tax Allowed?',
            },
          ]}
          name="taxType"
        >
          <Select
            showSearch
            placeholder="Search to Select"
            optionFilterProp="children"
            onChange={e => setTaxType (e)}
            options={[
              {
                value: 'Yes',
                label: 'Yes',
              },
              {
                value: 'Semi',
                label: 'Semi',
              },
              {
                value: 'No',
                label: 'No',
              },
            ]}
          />
        </Form.Item>
        <Form.Item
          style={{margin: '5px', width: '47%'}}
          label="Is pension Allowed"
          rules={[
            {
              required: true,
              message: 'Is pension Allowed?',
            },
          ]}
          name="pensionType"
        >
          <Select
            showSearch
            placeholder="Search to Select"
            optionFilterProp="children"
            options={[
              {
                value: 'Yes',
                label: 'Yes',
              },
              {
                value: 'No',
                label: 'No',
              },
            ]}
          />
        </Form.Item>
        </>}
        {TaxType==="Semi"?
        <>
        <Form.Item
          style={{margin: '5px', width: '47%'}}
          label="Semi Tax Type"
          rules={[
            {
              required: true,
              message: 'Semi Tax Type?',
            },
          ]}
          name="semiTaxType"
        >
          <Select
            showSearch
            placeholder="Search to Select"
            onChange={e => setSemiTaxType (e)}
            optionFilterProp="children"
            options={[
              {
                value: 'Fixed',
                label: 'Over Fixed amount',
              },
              {
                value: 'Percent',
                label: 'Over Salary Percent',
              },
            ]}
          />
        </Form.Item>
        {semiTaxType&&<Form.Item
          style={{margin: '5px', width: '47%'}}
          label="Min non taxable"
          rules={[
            {
              required: true,
              message: 'Min non taxable?',
            },
          ]}
          name="minNonTaxable"
        >
          <InputNumber
            prefix={semiTaxType === 'Fixed' ? 'Br' : '%'}
            style={{width: '100%'}}
          />
        </Form.Item>}
        </>
        :null}
        <Form.Item
          style={{margin: '5px', width: '48%'}}
          label="Applicable After (working days)"
          rules={[
            {
              required: true,
              message: 'Applicable After?',
            },
          ]}
          name="applicableAfter"
        >
          <Input type='number'/>
        </Form.Item>
        <Form.Item
          style={{margin: '5px', width: '47%'}}
          label="Condition"
          rules={[
            {
              required: true,
              message: 'condition Type?',
            },
          ]}
          name="conditionType"
        >
          <Select
            showSearch
            onChange={e => setConditionType (e)}
            placeholder="Search to Select"
            optionFilterProp="children"
            options={[
              {
                value: 'Deduct',
                label: 'Deduct From Salary',
              },
              {
                value: 'Add',
                label: 'Add To Salary',
              },
              {
                value: 'IncomeTax',
                label: 'Income Tax',
              },
              {
                value: 'Pension',
                label: 'PF 7%',
              },
              {
                value: 'Other',
                label: 'Other',
              },
            ]}
          />
        </Form.Item>
        {conditionType==="Other"&&<Form.Item
          label="Formula"
          style={{margin: '5px', width: '100%'}}
          rules={[
            {
              required: true,
              message: 'Please input Formal',
            },
          ]}
          name="formula"
        >
          <TextArea placeholder='Basic * 15/100'/>
        </Form.Item>}

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

export default NewSalaryComponentsForm;
