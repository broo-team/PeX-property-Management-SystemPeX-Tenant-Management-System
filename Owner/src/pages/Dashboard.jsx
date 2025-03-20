import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Spin } from 'antd';
import { MdOutlineBedroomParent, MdOutlineMedicalServices} from "react-icons/md";
import { FaPeopleRoof } from "react-icons/fa6";
import { GiFlood } from "react-icons/gi";
import { GrHostMaintenance } from "react-icons/gr";
import { RiIndeterminateCircleFill } from "react-icons/ri";
import { BACKENDURL } from '../helper/Urls';

const Dashboard = () => {
  const [tenant, setTenant] = useState(null);
  const [stallcode, setStallCode] = useState(null);
  const [room, setRoom] = useState(null);
  const [terminatedTenants, setTerminatedTenants] = useState(null);
  const [utilityUsage, setUtilityUsage] = useState(null);
  const [maintenance,Setmaintenance] = useState(null)

  useEffect(() => {
    fetch(`http://localhost:5000/api/tenants`)
      .then((response) => response.json())
      .then((data) => setTenant(data.length))
      .catch(() => setTenant(0));

    fetch(`http://localhost:5000/stalls`)
      .then((response) => response.json())
      .then((data) => setStallCode(data.length))
      .catch(() => setStallCode(0));

    fetch(`${BACKENDURL}/api/posts/room`)
      .then((response) => response.json())
      .then((data) => setRoom(data.length))
      .catch(() => setRoom(0));

    fetch(`${BACKENDURL}/api/tenants/terminated`)
      .then((response) => response.json())
      .then((data) => setTerminatedTenants(data.length))
      .catch(() => setTerminatedTenants(0));

    fetch(`${BACKENDURL}/api/utility/usage`)
      .then((response) => response.json())
      .then((data) => setUtilityUsage(data.length))
      .catch(() => setUtilityUsage(0));

      fetch(`${BACKENDURL}/maintenance-requests`)
      .then((response) => response.json())
      .then((data) => Setmaintenance(data.length))
      .catch(() => Setmaintenance(0));
  }, []);

  const cardData = [
    {
      title: 'Tenants',
      icon: <FaPeopleRoof size={40} color={'rgb(0,140,255)'} />,
      link: '/tenants',
      count: tenant,
    },
    {
      title: 'Stalls',
      icon: <GiFlood size={40} color={'rgb(0,140,255)'} />,
      link: '/stall-management',
      count: stallcode,
    },
    {
      title: 'Rooms',
      icon: <MdOutlineBedroomParent size={40} color={'rgb(0,140,255)'} />,
      link: '/stall-management',
      count: room,
    },
    {
      title: 'Terminated Tenants',
      icon: <RiIndeterminateCircleFill size={40} color={'rgb(0,140,255)'} />,
      link: '/terminated-tenants',
      count: terminatedTenants,
    },
    {
      title: 'Utility Usage',
      icon: <MdOutlineMedicalServices size={40} color={'rgb(0,140,255)'} />,
      link: '/utility-usage',
      count: utilityUsage,
    },
    {
      title: 'Maintenance',
      icon: <GrHostMaintenance size={40} color={'rgb(0,140,255)'} />,
      link: '/maintenance-requests',
      count: maintenance,
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
                  <p>{card.count} {card.title}</p>
                ) : (
                  <Spin />
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
