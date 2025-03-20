import React, { useEffect, useState } from 'react';
import { Row, Col, Card } from 'antd';
import axios from 'axios';
import { Pie, Bar } from 'react-chartjs-2';
import {
    Chart,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement, // Import BarElement
} from 'chart.js';
import { BACKENDURL } from '../../helper/Urls';

// Registering the necessary components
Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement); // Add BarElement here

const ReportAnalyticsPage = () => {
    const [analyticsData, setAnalyticsData] = useState(null);

    useEffect(() => {
        // Fetch analytics data from backend
        axios.get(`${BACKENDURL}/reports/analytics`)
            .then(response => {
                setAnalyticsData(response.data);
            })
            .catch(error => {
                console.error('Error fetching analytics', error);
            });
    }, []);

    if (!analyticsData) {
        return <div>Loading...</div>;
    }

    // Data transformation for charts
    const measurementData = {
        labels: analyticsData.measurementStats.map(stat => stat.reportMeasurement),
        datasets: [
            {
                data: analyticsData.measurementStats.map(stat => stat._count.reportMeasurement),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
            },
        ],
    };

    const locationData = {
        labels: analyticsData.locationStats.map(stat => stat.location),
        datasets: [
            {
                label: 'Reports by Location',
                data: analyticsData.locationStats.map(stat => stat._count.location),
                backgroundColor: '#36A2EB',
            },
        ],
    };

    return (
        <div style={{ padding: '20px' }}>
            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <Card title="Reports by Measurement">
                        <Pie data={measurementData} />
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title="Reports by Location">
                        <Bar data={locationData} />
                    </Card>
                </Col>
                {/* You can add more charts for shift times and dates similarly */}
            </Row>
        </div>
    );
};

export default ReportAnalyticsPage;
