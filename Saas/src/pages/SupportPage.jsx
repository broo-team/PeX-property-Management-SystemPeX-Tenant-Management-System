import {Button, Result, Space} from 'antd';
import React from 'react';
import {FaMailBulk} from 'react-icons/fa';
import {FaPhone} from 'react-icons/fa6';
import {useNavigate} from 'react-router-dom';

const SupportPage = () => {
  const navigate = useNavigate ();
  return (
    <Result
      status="500"
      title="Need Help! Contact Us"
      subTitle="Help & Support"
      extra={
        <Space>
          <a target="_blank" href="tel:0962444445"><FaPhone size={25}/></a>
          or
          <a target="_blank" href="mailto:info@securehrtech.com">
            <FaMailBulk size={25}/>
          </a>
        </Space>
      }
    />
  );
};

export default SupportPage;
