import {
  Button,
  DatePicker,
  Form,
  Input,
  Select,
  Upload,
} from 'antd';
import axios from 'axios';
import React, {useContext, useState} from 'react';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL, BLACKLISTAPI} from '../../../helper/Urls';
import {FaUpload} from 'react-icons/fa';

const ReportEmployee = ({data,openModalFun, reload}) => {
  const {openNotification} = useContext (AlertContext);
  const [loading, setLoading] = useState (false);
  const [form] = Form.useForm ();
  const [formValues, setFormValues] = useState ({
    ['idNumber']: '1',
    ['firstName']: "fname",
    ['middleName']: "mname",
    ['lastName']: "lname",
    ['employeePhoto']: 'employeePhoto',
    ['gender']: 'Male',
    ['dateOfBirth']: "2002-21-11",
    ['mobile']:'0911223322',
    ['name']:"Two X",
    ['type']:'Security',
    ['email']:'Twox@gmail.com',
    ['phone']:'0113458421',
    ['tinNumber']:'87HGH7',
    ['licenseNumber']:'1789732',
    ['jobTitle']:'sales',
    ['startDate']:"2002-21-11",
    ['endDate']:"2002-21-11",
    ['status']:'active',
    ['reportername']:'John doe',
    ['reporterphone']:'093367282',
  });
  // const [formValues, setFormValues] = useState ({['empId']: data.id,});
  const {Dragger} = Upload;

  const onFinish = async () => {
    setLoading (true);
    try {
      const res=await axios.post (`${BLACKLISTAPI}/incidents/new`,formValues);
      setLoading (false);
      reload()
      openModalFun (false);
      openNotification ('success',res.data.message, 3, 'green');
      form.resetFields ();
    } catch (error) {
      setLoading (false);
      openNotification ('error', error.response.data.message, 3, 'red');
    }
  };
  const onFinishFailed = errorInfo => {
    console.log ('Failed:', errorInfo);
  };

  const formInfos = [
    {
      title: 'Personal Information',
      key: 1,
      children: [
        {
          lable: 'Incidents',
          name: 'incidents',
          type: 'Select',
          multiple:true,
          options: [
            {value: 'Tefth', lable: '1'},
            {value: 'Security', lable: '2'},
          ],
          width: '31%',
        },
        {
          lable: 'Incident Magnitude',
          name: 'incidentMagnitude',
          type: 'Select',
          options: [
            {value: 'Tefth', lable: '1'},
            {value: 'Security', lable: '2'},
          ],
          width: '31%',
        },
        {lable: 'Incident Date', name: 'incidentDate', type: 'Date', width: '31%'},
        {
          lable: 'Note',
          name: 'note',
          type: 'Input',
          req: 'number',
          width: '100%',
        },
        {
          lable: 'Attachments',
          name: 'Attachments',
          type: 'File',
          req: 'application/pdf',
          width: '100%',
        },
      ],
    },
  ];

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
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          {formInfos[0].children.map ((data, key) => (
            <Form.Item
              key={key}
              style={{margin: '5px', width: `${data.width}`}}
              label={data.lable}
              name={data.name}
              rules={[
                {
                  required: data.notRequired ? false : true,
                  message: `Please input ${data.lable}`,
                },
              ]}
            >
              {data.type === 'Input'
                ? <Input
                    onChange={e => onFieldChange (data.name, e.target.value)}
                    minLength={data.min?data.min:1}
                    maxLength={data.max?data.max:400}
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
                            onChange={e =>{onFieldChange (data.name, e)}}
                          />
                        : data.type === 'File' &&
                            <Dragger
                              name={data.name}
                              accept={data.req}
                              onChange={e => {
                                onFieldChange (data.name, e.file.name);
                              }}
                              multiple={false}
                              maxCount={1}
                            >
                              <p className="ant-upload-drag-icon">
                                <FaUpload />
                              </p>
                              <p className="ant-upload-text">
                                {formValues.Attachments === data.name
                                  ? 'Click or drag file to this area to upload'
                                  : formValues.Attachments}
                              </p>
                              <p className="ant-upload-hint">
                                Support for a single
                                {' '}
                                {data.req === 'image/*' ? 'image' : 'Pdf'}
                                {' '}
                                file. Max size 3MB.
                              </p>
                            </Dragger>}
            </Form.Item>
          ))}
        </div>
          <Button
            type="primary"
            style={{width: '100%'}}
            onClick={onFinish}
            disabled={loading}
            loading={loading}
          >
            Report
          </Button>
      </div>
    </Form>
  );
};

export default ReportEmployee;
