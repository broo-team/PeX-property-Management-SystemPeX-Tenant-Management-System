import {
  Button,
  DatePicker,
  Divider,
  Form,
  Input,
  Select,
  Steps,
  Upload,
} from 'antd';
import axios from 'axios';
import React, {useContext, useEffect, useState} from 'react';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL} from '../../../helper/Urls';
import {FaUpload} from 'react-icons/fa';

const HireEmployee = ({data,openModalFun, reload}) => {
  const {openNotification} = useContext (AlertContext);
  const [loading, setLoading] = useState (false);
  const [form] = Form.useForm ();
  const [formValues, setFormValues] = useState ({['empId']: data.id,});
  const {Dragger} = Upload;

  const [branchData, setBranchData] = useState ([]);
  const [branchId, setBranchId] = useState ('');
  const [loadingBranch, setLoadingBranch] = useState (false);

  const getBranchData = async () => {
    setLoadingBranch (true);
    try {
      const res = await axios.get (`${BACKENDURL}/organzation/branch/all`);
      setLoadingBranch (false);
      setBranchData (res.data.branchs);
    } catch (error) {
      openNotification ('error', error.response.data.message, 3, 'red');
      setLoadingBranch (false);
    }
  };

  const branchOptions = branchData.length
  ? branchData.map(branch => ({
    value: branch.id,
    label: branch.name 
  }))
  : [];

  useEffect(() => {
    getBranchData ();
  }, []);

  const [departmentData, setDepartmentData] = useState ([]);
  const [loadingDepartment, setLoadingDepartment] = useState (false);
  const [departmentId, setDepartmentId] = useState ('');

  const getDepartmentData = async (id) => {
    setLoadingDepartment (true);
    form.resetFields (['department']);
    try {
      const res = await axios.get (`${BACKENDURL}/organzation/department/find?branchId=${id}`);
      setLoadingDepartment (false);
      setDepartmentData (res.data.departments);
    } catch (error) {
      openNotification ('error', error.response.data.message, 3, 'red');
      setLoadingDepartment (false);
    }
  };

  const departmentOptions = departmentData.length
    ? departmentData.map (department => ({
        value: department.id,
        label: department.name,
      }))
    : [];

  useEffect (() => {
    getDepartmentData (branchId);
  }, [branchId]);

  const [positionData, setPositionData] = useState ([]);
  const [loadingPosition, setLoadingPosition] = useState (false);

  const getPositionData = async (id) => {
    setLoadingPosition (true);
    form.resetFields (['position']);
    try {
      const res = await axios.get (`${BACKENDURL}/organzation/position/find?departmentId=${id}`);
      setLoadingPosition (false);
      setPositionData (res.data.positions);
    } catch (error) {
      openNotification ('error', error.response.data.message, 3, 'red');
      setLoadingPosition (false);
    }
  };

  const positionOptions = positionData.length
    ? positionData.map (position => ({
        value: position.id,
        label: position.name,
      }))
    : [];

  useEffect(() => {
    getPositionData (departmentId);
  }, [departmentId]);

  const onFinish = async () => {
    setLoading (true);
    try {
      const res=await axios.post (`${BACKENDURL}/employee/hire`,formValues);
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

  const [currentSlide, setCurrentSlide] = useState (0);
  const formInfos = [
    {
      title: 'Personal Information',
      key: 1,
      children: [
        {
          lable: 'Doc No',
          name: 'docNo',
          type: 'Input',
          notRequired: true,
          width: '30%',
        },
        {
          lable: 'Rank',
          name: 'rank',
          type: 'Input',
          width: '30%',
        },
        {
          lable: 'ID Number',
          name: 'IDNumber',
          type: 'Input',
          width: '30%',
        },
        {
          lable: 'Profile Photo',
          name: 'profilePhoto',
          type: 'File',
          req: 'image/*',
          width: '30%',
        },
        {
          lable: 'ID Front',
          name: 'IDF',
          type: 'File',
          req: 'image/*',
          width: '30%',
        },
        {
          lable: 'ID Back',
          name: 'IDB',
          type: 'File',
          req: 'image/*',
          width: '30%',
        },
      ],
    },

    {
      title: 'Work Information',
      key: 3,
      children: [
        {
          lable: 'Branch',
          name: 'branch',
          width: '47%',
          type: 'Select',
          options:branchOptions,
        },
        {
          lable: 'Department',
          name: 'department',
          width: '47%',
          type: 'Select',
          options:departmentOptions,
        },
        {
          lable: 'Position',
          name: 'position',
          width: '47%',
          type: 'Select',
          options:positionOptions,
        },
        {
          lable: 'Employment Type',
          name: 'employementType',
          type: 'Select',
          options: [
            {value: 'Full Time', lable: 'Full Time'},
            {value: 'Temporary', lable: 'Temporary'},
          ],
          width: '47%',
        },
        {
          lable: 'Shift',
          name: 'shift',
          type: 'Select',
          options: [
            {value: 'Basic', lable: 'Basic'},
            {value: 'Security', lable: 'Security'},
          ],
          width: '31%',
        },
        {
          lable: 'Salary',
          name: 'salary',
          type: 'Input',
          width: '31%',
          req: 'number',
        },
        {lable: 'Start Date', name: 'startDate', type: 'Date', width: '31%'},
        {
          lable: 'Agreement',
          name: 'agreement',
          type: 'File',
          req: 'application/pdf',
          width: '100%',
        },
        {
          lable: 'Bank Name',
          name: 'bankName',
          type: 'Select',
          width: '31%',
          notRequired: true,
        },
        {
          lable: 'Account Number',
          name: 'accountNumber',
          type: 'Input',
          req: 'number',
          width: '31%',
          notRequired: true,
        },
        {
          lable: 'Tin Number',
          name: 'TIN',
          type: 'Input',
          req: 'number',
          width: '31%',
          notRequired: true,
        },
      ],
    },

    {
      title: 'Related Information',
      key: 4,
      children: [
        {
          lable: 'Marital status',
          name: 'maritalStatus',
          type: 'Input',
          width: '47%',
          notRequired: true,
        },
        {
          lable: 'Religion',
          name: 'religion',
          type: 'Input',
          width: '47%',
          notRequired: true,
        },
        {
          lable: 'Ethnic Group',
          name: 'ethnicGroup',
          type: 'Input',
          width: '47%',
          notRequired: true,
        },
        {
          lable: 'Blood Group',
          name: 'bloodGroup',
          type: 'Input',
          width: '47%',
          notRequired: true,
        },
        {
          lable: 'Medical Report',
          name: 'medicalReport',
          type: 'File',
          req: 'application/pdf',
          width: '100%',
        },
        {
          lable: 'FingerPrint Report',
          name: 'fingerPrintReport',
          type: 'File',
          req: '.tml',
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

  const onNext = () => {
    setCurrentSlide (c => c + 1);
  };

  const FindPosition=(name,value)=>{
    if(name === 'branch') {
      setBranchId(value);
    } else if(name === 'department') {
      setDepartmentId(value);
    }
  }
  return (
    <Form
      layout="vertical"
      onFinish={onNext}
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
          <Steps
            current={currentSlide}
            items={formInfos.map ((l, k) => [{title: l.title}])}
          />
          <Divider>{formInfos[currentSlide].title}</Divider>
          {formInfos[currentSlide].children.map ((data, key) => (
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
                            onChange={e =>{onFieldChange (data.name, e);FindPosition(data.name,e)}}
                          />
                        : data.type === 'File' &&
                            <Dragger
                              name='file'
                              action={data.name==='fingerPrintReport'?
                                `${BACKENDURL}/upload/fingerprint`:`${BACKENDURL}/upload/new`
                              }
                              accept={data.req}
                              onChange={e => {
                                if(e.file.status==='done')onFieldChange (data.name, e.file.response.name.filename);
                              }}
                              multiple={false}
                              maxCount={1}
                            >
                              <p className="ant-upload-drag-icon">
                                <FaUpload />
                              </p>
                              <p className="ant-upload-text">
                                {formValues.name === data.name
                                  ? 'Click or drag file to this area to upload'
                                  : formValues.name}
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
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            height: '50px',
            alignItems: 'center',
          }}
        >
          {currentSlide !== 0 &&
            <Button
              disabled={currentSlide === 0}
              onClick={() => setCurrentSlide (c => c - 1)}
            >
              Back
            </Button>}
          {currentSlide !== formInfos.length - 1 &&
            <Form.Item
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '15px',
              }}
            >
              <Button
                type="primary"
                htmlType="submit"
                disabled={currentSlide === formInfos.length - 1}
              >
                Next
              </Button>
            </Form.Item>}
        </div>
        {formInfos.length - 1 === currentSlide &&
          <Button
            type="primary"
            style={{width: '100%'}}
            onClick={onFinish}
            disabled={loading}
            loading={loading}
          >
            Register
          </Button>}
      </div>
    </Form>
  );
};

export default HireEmployee;
