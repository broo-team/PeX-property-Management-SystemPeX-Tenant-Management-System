import {Button, DatePicker, Form, Input, Select, Upload} from 'antd';
import axios from 'axios';
import React, {useContext, useEffect, useState} from 'react';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL} from '../../../helper/Urls';
import {FaUpload} from 'react-icons/fa';

const EditCompanyInfo = ({openModalFun, reload, formInfos, id}) => {
  const {openNotification} = useContext (AlertContext);
  const [loading, setLoading] = useState (false);
  const [form] = Form.useForm ();
  const [formValues, setFormValues] = useState ({});
  const {Dragger} = Upload;

  const onFinish = async () => {
    setLoading (true);
    try {
      const res = await axios.post (
        `${BACKENDURL}/organzation/business/update`,
        formValues
      );
      reload ();
      setLoading (false);
      openModalFun (false);
      openNotification ('success', res.data.message, 3, 'green');
      setFormValues ({});
    } catch (error) {
      setLoading (false);
      openNotification ('error', error.response.data.message, 3, 'red');
    }
  };
  const onFinishFailed = errorInfo => {
    console.log ('Failed:', errorInfo);
  };

  const onFieldChange = (name, e) => {
    setFormValues ({
      ...formValues,
      [name]: e,
    });
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
        {formInfos.map ((data, key) => (
          <Form.Item
            style={{margin: '5px 0', width: `${data.width}`}}
            label={data.label}
            name={data.name}
            rules={[
              {
                required: data.notRequired ? false : true,
                message: `Please input ${data.label}`,
              },
            ]}
          >
            {data.children ? '' : 'N/A'}
            {data.type === 'Input'
              ? <Input
                  onChange={e => onFieldChange (data.name, e.target.value)}
                  minLength={data.min ? data.min : 1}
                  maxLength={data.max ? data.max : 400}
                  type={data.req && data.req}
                />
              : data.type === 'Date'
                  ? <DatePicker
                      onChange={e => {
                        onFieldChange (data.name, e && e.toISOString ());
                      }}
                    />
                  : data.type === 'Select'
                      ? <Select
                          options={data.options}
                          onChange={e => {
                            onFieldChange (data.name, e);
                          }}
                        />
                      : data.type === 'File' &&
                          <Dragger
                            name="file"
                            action={`${BACKENDURL}/upload/new`}
                            accept={data.req}
                            onChange={e => {
                              if (e.file.status === 'done')
                                onFieldChange (data.name, e.file.name);
                            }}
                            multiple={false}
                            maxCount={1}
                          >
                            <div className="ant-upload-drag-icon">
                              <FaUpload />
                            </div>
                            <div className="ant-upload-hint">
                              Support for a single
                              {' '}
                              {data.req === 'image/*' ? 'image' : 'Pdf'}
                              {' '}
                              file. Max size 3MB.
                            </div>
                          </Dragger>}
          </Form.Item>
        ))}
      </div>
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          height: '50px',
          alignItems: 'center',
        }}
      />
      <Button
        type="primary"
        style={{width: '100%'}}
        onClick={onFinish}
        disabled={loading}
        loading={loading}
      >
        Update
      </Button>
    </Form>
  );
};

export default EditCompanyInfo;
