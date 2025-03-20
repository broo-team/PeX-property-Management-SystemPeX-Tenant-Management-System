import {Button, DatePicker, Form, Input, Select} from 'antd';
import axios from 'axios';
import React, {useContext, useEffect, useState} from 'react';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL} from '../../../helper/Urls';

const GeneratePayrollForm = ({openModalFun, reload}) => {
  const {openNotification} = useContext (AlertContext);
  const [loading, setLoading] = useState (false);
  const [form] = Form.useForm ();

  const [branchData, setBranchData] = useState ([]);
  const [branchId, setBranchId] = useState ('');
  const [payrollBasedOn, setPayrollBasedOn] = useState ('');
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
    ? branchData.map (branch => ({
        value: branch.id,
        label: branch.name,
      }))
    : [];

  const [projetcData, setProjectData] = useState ([]);
  const [loadingProject, setLoadingProject] = useState (false);

  const getProjectData = async () => {
    setLoadingProject (true);
    try {
      const res = await axios.get (`${BACKENDURL}/project/all`);
      setLoadingProject (false);
      setProjectData (res.data.projects);
    } catch (error) {
      openNotification ('error', error.response.data.message, 3, 'red');
      setLoadingProject (false);
    }
  };

  const projectOptions = projetcData.length
    ? projetcData.map (branch => ({
        value: branch.id,
        label: branch.site,
      }))
    : [];

  useEffect (() => {
    getBranchData ();
    getProjectData ();
  }, []);

  const [departmentData, setDepartmentData] = useState ([]);
  const [loadingDepartment, setLoadingDepartment] = useState (false);

  const getDepartmentData = async id => {
    setLoadingDepartment (true);
    form.resetFields (['department']);
    try {
      const res = await axios.get (
        `${BACKENDURL}/organzation/department/find?branchId=${id}`
      );
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

  useEffect (
    () => {
      getDepartmentData (branchId);
    },
    [branchId]
  );

  const onFinish = async values => {
    setLoading (true);
    try {
      const res = await axios.post (`${BACKENDURL}/payroll/generate/new`, {
        from: values.from,
        to: values.to,
        project: values.project,
        basedOn: values.basedOn,
      });
      reload ();
      setLoading (false);
      openModalFun (false);
      openNotification ('success', res.data.message, 3, 'green');
      console.log(res.data.all)
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
          style={{width: '49%'}}
          label="From"
          rules={[
            {
              required: true,
              message: 'Please input From',
            },
          ]}
          name="from"
        >
          <DatePicker style={{width: '100%'}} />
        </Form.Item>

        <Form.Item
          style={{width: '49%'}}
          label="To"
          rules={[
            {
              required: true,
              message: 'Please input To',
            },
          ]}
          name="to"
        >
          <DatePicker style={{width: '100%'}} />
        </Form.Item>

        <Form.Item
          style={{width: '100%'}}
          label="Payroll Based On"
          rules={[
            {
              // required: true,
              message: 'Payroll Based On?',
            },
          ]}
          name="basedOn"
        >
          <Select
            placeholder="Search to Select"
            onChange={e => setPayrollBasedOn (e)}
            options={[
              {
                value: 'Position',
                label: 'Position (attendance)',
              },
              {
                value: 'Project',
                label: 'Project (timesheet)',
              },
            ]}
          />
        </Form.Item>
        {
        // payrollBasedOn === ''
        //   ? null
        //   : 
          payrollBasedOn === 'Position'
              ? <div
                  style={{
                    display: 'flex',
                    width:'100%',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                  }}
                >
                  <Form.Item
                    style={{margin: '5px', width: '47%'}}
                    label="Branch"
                    name="branch"
                    rules={[
                      {
                        required: true,
                        message: 'Please input Branch',
                      },
                    ]}
                  >
                    <Select
                      placeholder="Search to Select"
                      onChange={e => setBranchId (e)}
                      options={branchOptions}
                      loading={loadingBranch}
                      disabled={loadingBranch}
                    />
                  </Form.Item>
                  <Form.Item
                    style={{margin: '5px', width: '47%'}}
                    label="Department"
                    name="department"
                    rules={[
                      {
                        required: true,
                        message: 'Please input Department',
                      },
                    ]}
                  >
                    <Select
                      placeholder="Search to Select"
                      options={departmentOptions}
                      loading={loadingDepartment}
                      disabled={loadingDepartment || departmentData.length < 1}
                    />
                  </Form.Item>

                  <Form.Item
                    style={{margin: '5px', width: '47%'}}
                    label="Position"
                    name="position"
                    rules={[
                      {
                        required: true,
                        message: 'Please input Position',
                      },
                    ]}
                  >
                    <Select
                      placeholder="Search to Select"
                      options={departmentOptions}
                      loading={loadingDepartment}
                      disabled={loadingDepartment || departmentData.length < 1}
                    />
                  </Form.Item>
                </div>
              : <Form.Item
                  style={{margin: '5px', width: '100%'}}
                  label="Project"
                  name="project"
                  rules={[
                    {
                      required: true,
                      message: 'Please input Project',
                    },
                  ]}
                >
                  <Select
                    placeholder="Search to Select"
                    options={projectOptions}
                    loading={loadingProject}
                    disabled={loadingProject || projectOptions.length < 1}
                  />
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
          Generate
        </Button>
      </Form.Item>
    </Form>
  );
};

export default GeneratePayrollForm;
