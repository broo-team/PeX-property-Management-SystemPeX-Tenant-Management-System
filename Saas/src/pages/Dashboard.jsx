import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Spin } from 'antd';
import { BACKENDURL } from '../helper/Urls';
import { MdContacts } from "react-icons/md";
import { MdOutlineMedicalServices } from "react-icons/md";
import { FaPeopleLine } from "react-icons/fa6";
import { FaRegNewspaper } from "react-icons/fa6";
const Dashboard = () => {;
  const [contact, SetContact] = useState(null);
  const [service, Setservice] = useState(null);
  const [news, SetNews] = useState(null);;
  const [award, setAward] =useState(null);

  // Fetch the counts from APIs (replace with your actual API calls)
  useEffect(() => {
    // Fetch employee count
    fetch(`${BACKENDURL}/api/get/contacts`) // Replace with actual API endpoint
      .then((response) => response.json())
      .then((data) => SetContact(data.length)
      )
      .catch(() => SetContact(0));


    fetch(`${BACKENDURL}/award/partner/getpartners`) // Replace with actual API endpoint
      .then((response) => response.json())
      .then((data) => setAward(data.length)
      )
      .catch(() => setAward(0));

      fetch(`${BACKENDURL}/api/posts/services`) // Replace with actual API endpoint
      .then((response) => response.json())
      .then((data) => Setservice(data.length)
      )
      .catch(() => Setservice(0));


      fetch(`${BACKENDURL}/news/blog`) // Replace with actual API endpoint
      .then((response) => response.json())
      .then((data) => SetNews(data.length)
      )
      .catch(() => SetNews(0));
  }, []);

  const cardData = [
    {
      title: 'contact',
      icon: <MdContacts size={40} color={'rgb(0,140,255)'} />,
      link: '/contact/info',
      count: contact,
    },
    {
      title: 'service',
      icon: <MdOutlineMedicalServices size={40} color={'rgb(0,140,255)'} />,
      link: '/admin/service',
      count: service,
    },
    {
      title: 'Award And Partners',
      icon: <FaPeopleLine size={40} color={'rgb(0,140,255)'} />,
      link: '/admin/partners',
      count: award,
    },
    {
      title: 'News And Blog',
      icon: <FaRegNewspaper size={40} color={'rgb(0,140,255)'} />,
      link: '/admin/blog',
      count: news,
    },
 
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Row gutter={[16, 16]}>
        {cardData.map((card, index) => (
          <Col xs={24} sm={12} md={8} lg={6} key={index}>
            <Link to={card.link}>
              <Card
                hoverable
                
                style={{ borderRadius: '10px', textAlign: 'center' }}
              >
                <div>{card.icon}</div>
                <h3>{card.title}</h3>
                {card.count !== null ? (
                  <p>{card.count} {card.title === 'Employee' ? 'Employees' : 'Items'}</p>
                ) : (
                  <Spin /> // Show spinner if data is still loading
                )}
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Dashboard;
