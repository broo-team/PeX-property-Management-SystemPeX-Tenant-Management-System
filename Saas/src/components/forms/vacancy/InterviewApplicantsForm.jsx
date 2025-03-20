import {Button, DatePicker, Form, Input, Select} from 'antd';
import axios from 'axios';
import React, {useContext, useEffect, useState} from 'react';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL} from '../../../helper/Urls';

const InterviewApplicantsForm = ({id, openModalFun, reload,applicantId}) => {
  const {openNotification} = useContext (AlertContext);
  const [loading, setLoading] = useState (false);
  const [loadingQ, setLoadingQ] = useState (false);
  const [form] = Form.useForm ();

  const [question, setQuestions] = useState ([
    {
      name: '',
      max: '',
      min: '',
    },
  ]);

  const [questionScore, setQuestionScore] = useState ([
    {
      name: '',
      score: '',
      max: '',
      min: '',
    },
  ]);

  const onFinish = async() => {
    setLoading (true);
    try {
      const res = await axios.post (`${BACKENDURL}/interview/applicant`, {
        questions: questionScore,
        applicant:applicantId,
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

  const getInterviewData = async () => {
    setLoadingQ (true);
    try {
      const res = await axios.get (`${BACKENDURL}/interview/detail?id=${id}`);
      setQuestions (
        res.data.interviewQ.map (question => ({
          name: question.name,
          max: question.maxValue,
          min: question.minValue,
        }))
      );
      setQuestionScore (
        res.data.interviewQ.map (question => ({
          name: question.name,
          score: 1,
          min:question.minValue,
          max:question.maxValue
        }))
      );
      setLoadingQ (false);
    } catch (error) {
      setLoadingQ (false);
      openNotification ('error', error.response.data.message, 3, 'red');
    }
  };

  useEffect (
    () => {
      getInterviewData ();
    },
    [id]
  );

  return (
    <div>
      {loadingQ
        ? 'Loading Questions'
        : question
            ? <Form
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
                  {question.map ((questions, index) => (
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
                        style={{margin: '0', width: '84%'}}
                        label={`Question ${index + 1}`}
                      >
                        <span>
                          {questions.name}
                        </span>
                      </Form.Item>
                      <Form.Item
                        style={{margin: '0', width: '15%'}}
                        label="Score"
                        rules={[{required: true, message: 'Score Required'}]}
                      >
                        <Input
                          placeholder="3"
                          type="number"
                          min={questions.min}
                          max={questions.max}
                          onChange={e => {
                            const value = e.target.value;
                            setQuestionScore (prev => {
                              const updatedQuestion = [...prev];
                              updatedQuestion[index].score = value;
                              return updatedQuestion;
                            });
                          }}
                        />
                      </Form.Item>
                    </div>
                  ))}
                </div>
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
                    disabled={loading}
                    loading={loading}
                  >
                    Submit
                  </Button>
                </Form.Item>
              </Form>
            : 'Loading Questions'}
    </div>
  );
};

export default InterviewApplicantsForm;
