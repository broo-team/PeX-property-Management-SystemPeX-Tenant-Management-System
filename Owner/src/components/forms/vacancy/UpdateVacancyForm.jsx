import {Button, DatePicker, Form, Input, Select} from 'antd';
import axios from 'axios';
import React, {useContext, useEffect, useState} from 'react';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL} from '../../../helper/Urls';
import TextArea from 'antd/es/input/TextArea';

const UpdateVancayForm = ({id,openModalFun, reload}) => {
  const {openNotification} = useContext (AlertContext);
  const [loading, setLoading] = useState (false);
  const [form] = Form.useForm ();

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
  const [positionId, setPositionId] = useState ('');

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

  const onFinish = async values => {
    setLoading (true);
    try {
      const res = await axios.post (`${BACKENDURL}/vacancy/update`, {
        IDNO:id,
        title:values.title,
        position:values.position,
        vacancyType:values.vacancyType,
        employementType:values.employementType,
        interview:values.interviewId,
        gender:values.gender,
        location:values.location,
        sector:values.sector,
        experience:values.experience,
        deadline:values.deadline + "T00:00:00Z",
        vacancyNo:values.vacancyNo,
        salary:values.salary,
        description:values.description,
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

  const [vacancyData,setVacancyData]=useState([])

  const getVacancyData=async()=>{
    try {
      const res = await axios.get(`${BACKENDURL}/vacancy/detail?id=${id}`);
      setVacancyData(res.data.vacancy)
      setBranchId(res.data.vacancy.branch)
      setDepartmentId(res.data.vacancy.department)
      setPositionId(res.data.vacancy.position)
    } catch (error) {
      openNotification('error', error.response.data.message, 3, 'red');
    }
  }

  useEffect(()=>{
    getVacancyData()

    return setVacancyData([])
  },[id])


  const [interviewData, setInterviewData] = useState ([]);
  const [loadinginterview, setLoadinginterview] = useState (false);

  const getInterviewData = async (id) => {
    setLoadinginterview (true);
    try {
      const res = await axios.get (`${BACKENDURL}/interview/find?position=${positionId}`);
      setLoadinginterview (false);
      setInterviewData (res.data.interviews);
    } catch (error) {
      openNotification ('error', error.response.data.message, 3, 'red');
      setLoadinginterview (false);
    }
  };

  const interviewOptions = interviewData.length
    ? interviewData.map (interview => ({
        value: interview.id,
        label: interview.title,
      }))
    : [];

  useEffect(() => {
    getInterviewData ();
  }, [positionId]);

  return (
    <div>
      {Object.keys(vacancyData).length > 0 ? (
    <Form
      layout="vertical"
      onFinish={onFinish}
      form={form}
      onFinishFailed={onFinishFailed}
      initialValues={vacancyData}
      disabled={loading}
      autoComplete="on"
      autoFocus="true"
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
<Form.Item
          style={{margin: '5px 0', width: '34%'}}
          label="Branch"
          rules={[
            {
              required: true,
              message: 'Please input Branch',
            },
          ]}
          name="branch"
        >
          <Select
            placeholder="Search to Select"
            onChange={(e)=>setBranchId(e)}
            options={branchOptions}
            loading={loadingBranch}
            disabled={loadingBranch}
          />
        </Form.Item>

        <Form.Item
          style={{margin: '5px 0', width: '25%'}}
          label="Department"
          rules={[
            {
              required: true,
              message: 'Please input Department',
            },
          ]}
          name="department"
        >
          <Select
            onChange={(e)=>setDepartmentId(e)}
            placeholder="Search to Select"
            options={departmentOptions}
            loading={loadingDepartment}
            disabled={loadingDepartment}
          />
        </Form.Item>
        <Form.Item
          style={{margin: '5px 0', width:'35%'}}
          label="Position"
          rules={[
            {
              required: true,
              message: 'Please input Position',
            },
          ]}
          name="position"
        >
          <Select
            placeholder="Search to Select"
            onChange={(e)=>setPositionId(e)}
            options={positionOptions}
            loading={loadingPosition}
            disabled={loadingPosition}
          />
        </Form.Item>
        <Form.Item
          style={{margin: '5px', width: '100%'}}
          label="Title"
          rules={[
            {
              required: true,
              message: 'Please input Title',
            },
          ]}
          name="title"
        >
          <Input />
        </Form.Item>
        <Form.Item
          style={{margin: '5px', width: '47%'}}
          label="Vacancy Type"
          name="vacancyType"
          rules={[
            {
              required: true,
              message: 'Please input Type',
            },
          ]}
        >
          <Select
            placeholder="Search to Select"
            options={[
              {
                value: 'External',
                label: 'External',
              },
              {
                value: 'Internal',
                label: 'Internal',
              },
            ]}
          />
        </Form.Item>
        <Form.Item
          style={{margin: '5px', width: '47%'}}
          label="Employement Type"
          name="employementType"
          rules={[
            {
              required: true,
              message: 'Please input Type',
            },
          ]}
        >
          <Select
            placeholder="Search to Select"
            options={[
              {
                value: 'Full Time',
                label: 'Full Time',
              },
              {
                value: 'Remote',
                label: 'Remote',
              },
              {
                value: 'Contract',
                label: 'Contract',
              },
            ]}
          />
        </Form.Item>
        <Form.Item
          style={{margin: '5px', width: '40%'}}
          label="Interview"
          rules={[
            {
              required: true,
              message: 'Please input Interview',
            },
          ]}
          name="interviewId"
        >
          <Select
            showSearch
            placeholder="Search to Select"
            optionFilterProp="children"
            filterOption={(input, option) => (option?.label ?? '').includes(input)}
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
            }
            options={interviewOptions}
            loading={loadinginterview}
            disabled={loadinginterview}
          />
        </Form.Item>

        <Form.Item
          style={{margin: '5px', width: '20%'}}
          label="Gender"
          name="gender"
          rules={[
            {
              required: true,
              message: 'Please input Gender',
            },
          ]}
        >
          <Select
            placeholder="Select"
            options={[
              {
                value: 'Male',
                label: 'Male',
              },
              {
                value: 'Female',
                label: 'Female',
              },
              {
                value: 'Both',
                label: 'Both',
              },
            ]}
          />
        </Form.Item>
        <Form.Item
          style={{margin: '5px', width: '30%'}}
          label="Sector"
          rules={[
            {
              required: true,
              message: 'Please input Sector',
            },
          ]}
          name="sector"
        >
          <Input />
        </Form.Item>
        <Form.Item
          style={{margin: '5px 0', width: '25%'}}
          label="Experience"
          name="experience"
          rules={[
            {
              required: true,
              message: 'Please input Experience',
            },
          ]}
        >
          <Select
            placeholder="Search to Select"
            options={[
              {
                value: 'Fresh',
                label: 'Fresh',
              },
              {
                value: '1-2 Years',
                label: '1-2 Years',
              },
              {
                value: '3-5 Years',
                label: '3-5 Years',
              },
              {
                value: '+5 Years',
                label: '+5 Years',
              },
            ]}
          />
        </Form.Item>
        <Form.Item
          style={{margin: '5px 0', width: '20%'}}
          label="Vacancy"
          name="vacancyNo"
          rules={[
            {
              required: true,
              message: 'Please input Vacancy',
            },
          ]}
        >
          <Input type="number" min={1}/>
        </Form.Item>
        <Form.Item
          style={{margin: '5px 0', width: '25%'}}
          label="Salary"
          name="salary"
          rules={[
            {
              required: true,
              message: 'Please input Salary',
            },
          ]}
        >
          <Input type="number" min={1}/>
        </Form.Item>
        <Form.Item
          style={{margin: '5px 0', width: '25%'}}
          label="Deadline"
          name="deadline"
          rules={[
            {
              required: true,
              message: 'Please input Deadline',
            },
          ]}
        >
          <Input type='date' />
        </Form.Item>
        <Form.Item
          style={{margin: '5px', width: '100%'}}
          label="Description"
          name="description"
          rules={[
            {
              required: true,
              message: 'Please input Description',
            },
          ]}
        >
          <TextArea style={{height: '150px'}} />
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
          Update
        </Button>
      </Form.Item>
    </Form>
    ) : (
      <p>Loading Vacancy data...</p>
    )}
    </div>
  );
};

export default UpdateVancayForm;
