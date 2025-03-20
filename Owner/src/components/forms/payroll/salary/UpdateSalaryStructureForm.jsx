import {Button, DatePicker, Form, Input, Select, Spin} from 'antd';
import axios from 'axios';
import React, {useContext, useEffect, useState} from 'react';
import {AlertContext} from '../../../../context/AlertContext';
import {BACKENDURL} from '../../../../helper/Urls';

const UpdateSalaryStructureForm = ({id,openModalFun, reload}) => {
  const {openNotification} = useContext (AlertContext);
  const [loading, setLoading] = useState (false);
  const [form] = Form.useForm ();

  const [components, setComponents] = useState ([
    {
      id: '',
      amount: '',
    },
  ]);

  const handleAdd = () => {
    setComponents ([
      ...components,
      {
        id: '',
        amount: '',
      },
    ]);
  };

  const handleRemove = index => {
    setComponents (components.filter ((_, i) => i !== index));
  };

  const onFinish = async values => {
    setLoading (true);
    try {
      const res = await axios.post (`${BACKENDURL}/salary/structure/update`, {
        name: values.name,
        id:id,
        structure: components,
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

  const [SalaryComponentData, setSalaryComponentData] = useState ([]);
  const [loadingSalaryCom, setLoadingSalaryCom] = useState (false);

  const getSalaryComponentData = async () => {
    setLoadingSalaryCom (true);
    try {
      const res = await axios.get (`${BACKENDURL}/salary/components/all`);
      setLoadingSalaryCom (false);
      setSalaryComponentData (res.data.all);
    } catch (error) {
      openNotification ('error', error.response.data.message, 3, 'red');
      setLoadingSalaryCom (false);
    }
  };

  const salaryComponentOpt = SalaryComponentData.length
    ? SalaryComponentData.map (branch => ({
        value: branch.id,
        label: branch.name,
      }))
    : [];

  useEffect (() => {
    getSalaryComponentData ();
  }, []);


  const [structureData,setstructureData]=useState([])
  const [structureDataLoading,setstructureDataLoading]=useState(false)

  const getstructureData=async()=>{
    form.resetFields()
    setstructureDataLoading(true)
    try {
      const res = await axios.get(`${BACKENDURL}/salary/structure/detail?id=${id}`);
      setstructureDataLoading(false)
      setComponents(res.data.components.map(question => ({
        id: question.salaryComponentId, 
        amount: question.amount,
      })))
      setstructureData(res.data.structure)

    } catch (error) {
      setstructureDataLoading(false)
      openNotification('error', error.response.data.message, 3, 'red');
    }
  }

  useEffect(()=>{
    getstructureData()
    setTimeout(() => {
      getstructureData()
    }, 1000);
  },[id])

  
  return (
    <div>
      {structureDataLoading?<Spin style={{width:'100%'}}></Spin>:Object.keys(structureData).length > 0 ? (
    <Form
      layout="vertical"
      onFinish={onFinish}
      form={form}
      initialValues={structureData}
      disabled={loading}
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
          style={{margin: '5px', width: '100%'}}
          label="Name"
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

        {components.map ((components, index) => (
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
              style={{margin: '0', width: '75%'}}
              label="Component"
              rules={[{required: true, message: 'Component Required'}]}
            >

              <Select
                placeholder="Search to Select"
                onChange={e => {
                  const value = e;
                  setComponents (prev => {
                    const updatedQuestion = [...prev];
                    updatedQuestion[index].id = value;
                    return updatedQuestion;
                  });
                }}
                options={salaryComponentOpt}
                value={components.id}
                loading={loadingSalaryCom}
                disabled={loadingSalaryCom}
              />

            </Form.Item>
            <Form.Item
              style={{margin: '0', width: '20%'}}
              label="Amount"
              rules={[{required: true, message: 'Amount Required'}]}
            >

              <Input
                type="number"
                value={components.amount}
                onChange={e => {
                  const value = e.target.value;
                  setComponents (prev => {
                    const updatedQuestion = [...prev];
                    updatedQuestion[index].amount = value;
                    return updatedQuestion;
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
          Add Component
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
          Submit
        </Button>
      </Form.Item>
    </Form>
  ): (
    <p>Loading Component data...</p>
  )}
  </div>
  );
};

export default UpdateSalaryStructureForm;
