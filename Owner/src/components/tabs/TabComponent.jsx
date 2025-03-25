import React from 'react';
import { Tabs, Layout } from 'antd';
import { HomeOutlined, BulbOutlined } from '@ant-design/icons';
import Rent from '../Rent/Rent';
import Payments from '../../pages/Payments/Payments';

const { TabPane } = Tabs;
const { Content } = Layout;

const TabComponent = () => {
  return (
    <Layout >
      <Content style={{background: '#fff' }}>
        <Tabs 
          defaultActiveKey="rent"
          size="large"
          centered
          tabBarStyle={{ 
            margin: 0, 
            padding: 0, 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 0 
          }}
        >
          <TabPane
            tab={
              <span>
                <HomeOutlined />
                Rent
              </span>
            }
            key="rent"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Rent />
            </div>
            
          </TabPane>

          <TabPane
            tab={
              <span>
                <BulbOutlined />
                Utilities
              </span>
            }
            key="utilities"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
               <Payments/> 
            </div>
          </TabPane>
        </Tabs>
      </Content>
    </Layout>
  );
};

export default TabComponent;