import {Button, Form, Input, Select} from 'antd';
import axios from 'axios';
import React, {useContext, useEffect, useState} from 'react';
import { AlertContext } from '../../../context/AlertContext';
import { BACKENDURL } from '../../../helper/Urls';

const UpdateTimeSheetForm = ({openModalFun,id}) => {
  const {openNotification} = useContext (AlertContext);
  const [loading, setLoading] = useState (false);
  const [form] = Form.useForm();

  const onFinish = async values => {
    setLoading (true);
    try {
      const res = await axios.post(`${BACKENDURL}/timesheet/update`,{
        id:id,
        regularPH: values.regularPH,
        regularPOTH: values.regularPOTH,
        OT32: values.OT32,
      });
      // reload()
      setLoading (false);
      openModalFun(false)
      openNotification ('success', res.data.message, 3, 'green');
      form.resetFields()
    } catch (error) {
      setLoading (false);
      console.log(error)
      openNotification ('error', error.response.data.message, 3, 'red');
    }
  };
  const onFinishFailed = errorInfo => {
    console.log ('Failed:', errorInfo);
  };

  const [timeFormData,setTimeFormData]=useState([])

  const GetFormData=async()=>{
    try {
      const res = await axios.get(`${BACKENDURL}/timesheet/detail?id=${id}`);
      setTimeFormData(res.data.detail)
    } catch (error) {
      openNotification('error', error.response.data.message, 3, 'red');
    }
  }

  useEffect(()=>{
    GetFormData()

    return setTimeFormData([])
  },[id])

  return (
    <div>
      {Object.keys(timeFormData).length > 0 ? (
      <Form
      layout="vertical"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      initialValues={timeFormData}
      disabled={loading}
      autoComplete="on"
      autoFocus="true"
    >
      <div style={{display:'grid',gridTemplateColumns:'auto auto'}}>
      <Form.Item
        style={{margin: '5px'}}
        label="Regular Place Hour"
        name="regularPH"
      >
        <Input type='number'/>
      </Form.Item>

      <Form.Item
        style={{margin: '5px'}}
        label="Regular Place OT Hour"
        name="regularPOTH"
      >
        <Input type='number'/>
      </Form.Item>

      <Form.Item
        style={{margin: '5px'}}
        label="32 OT"
        rules={[
          {
            required: true,
            message: 'Please input 32 OT',
          },
        ]}
        name="OT32"
      >
        <Input type='number'/>
      </Form.Item>

      </div>
      <Form.Item
        style={{display: 'flex', justifyContent: 'center', marginTop: '15px'}}
      >
        <Button
          type="primary"
          style={{marginRight:'10px'}}
          htmlType="submit"
          disabled={loading}
          loading={loading}
        >
          Update
        </Button>
        <Button
          type='default'
          onClick={()=>openModalFun(false)}
        >
          Cancel
        </Button>
      </Form.Item>
    </Form>
    ) : (
      <p>Loading TimeSheet data...</p>
    )}
    </div>
  );
};

export default UpdateTimeSheetForm;
