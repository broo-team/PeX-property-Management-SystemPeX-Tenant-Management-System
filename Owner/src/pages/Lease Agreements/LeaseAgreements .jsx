import React, { useState, useEffect } from "react";
import { Table, Button, Space, message, Tag, notification } from "antd";
import dayjs from "dayjs";
import axios from "axios";

const LeaseAgreements = () => {
  const [leases, setLeases] = useState([]);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    fetchLeases();
    fetchRooms();
  }, []);

  const fetchLeases = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/tenants");
      const leaseData = response.data.map((tenant) => {
        const leaseEndDate = dayjs(tenant.lease_end);
        const daysRemaining = leaseEndDate.diff(dayjs(), "day");

        // Show reminder notification 5 days before lease ends
        if (daysRemaining === 5) {
          notification.warning({
            message: "Lease Expiring Soon",
            description: `The lease for ${tenant.full_name} (Room: ${tenant.room}) is ending in 5 days.`,
            duration: 5,
          });
        }

        return {
          key: tenant.id,
          tenantName: tenant.full_name,
          room: tenant.room,
          leaseStart: tenant.lease_start,
          leaseEnd: tenant.lease_end,
          leaseStatus: tenant.terminated
            ? "Terminated"
            : daysRemaining <= 5
            ? "Expiring Soon"
            : "Active",
          daysRemaining,
        };
      });

      setLeases(leaseData);
    } catch (error) {
      message.error("Failed to fetch lease agreements");
      console.error(error);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await axios.get("http://localhost:5000/stalls");
      setRooms(response.data);
    } catch (error) {
      message.error("Failed to fetch room details");
      console.error(error);
    }
  };

  const handleTerminate = async (key) => {
    try {
      await axios.put(`http://localhost:5000/api/tenants/terminate/${key}`);
      message.success("Lease terminated successfully!");
      fetchLeases();
    } catch (error) {
      message.error("Failed to terminate lease");
      console.error(error);
    }
  };

  const columns = [
    {
      title: "Tenant Name",
      dataIndex: "tenantName",
      key: "tenantName",
    },
    {
      title: "Room",
      dataIndex: "room",
      key: "room",
    },
    {
      title: "Lease Start",
      key: "leaseStart",
      render: (_, record) => dayjs(record.leaseStart).format("YYYY-MM-DD"),
    },
    {
      title: "Lease End",
      key: "leaseEnd",
      render: (_, record) => dayjs(record.leaseEnd).format("YYYY-MM-DD"),
    },
    {
      title: "Monthly Rent",
      key: "monthlyRent",
      render: (_, record) => {
        const stall = rooms.find(
          (s) => s.rooms === record.room || s.stallCode === record.room
        );
        return stall ? stall.monthlyRent : "-";
      },
    },
    {
      title: "Lease Status",
      key: "leaseStatus",
      render: (_, record) => {
        let color = "green";
        if (record.leaseStatus === "Terminated") color = "red";
        else if (record.leaseStatus === "Expiring Soon") color = "orange";

        return <Tag color={color}>{record.leaseStatus}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          {record.leaseStatus !== "Terminated" && (
            <Button type="link" danger onClick={() => handleTerminate(record.key)}>
              Terminate
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px" }}>Lease Agreements</h2>
      <Table columns={columns} dataSource={leases} rowKey="key" />
    </div>
  );
};

export default LeaseAgreements;

