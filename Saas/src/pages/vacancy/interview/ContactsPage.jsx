import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Spin } from "antd";
import axios from "axios";
import dayjs from "dayjs";

const ContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchContacts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/get/contacts");
      setContacts(response.data);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContactById = async (id) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/contacts/${id}`);
      setSelectedContact(response.data);
      setModalVisible(true);
    } catch (error) {
      console.error("Error fetching contact details:", error);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Message",
      dataIndex: "text",
      key: "text",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "date",
      render: (date) => dayjs(date).format("MMMM D, YYYY h:mm A"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button type="primary" onClick={() => fetchContactById(record.id)}>
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h1>Contact List</h1>
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          <Spin size="large" />
        </div>
      ) : (
        <Table dataSource={contacts} columns={columns} rowKey="id" />
      )}

      <Modal
        title="Contact Details"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        {selectedContact ? (
          <div>
            <p><strong>Name:</strong> {selectedContact.name}</p>
            <p><strong>Email:</strong> {selectedContact.email}</p>
            <p><strong>Phone:</strong> {selectedContact.phone}</p>
            <p><strong>Message:</strong> {selectedContact.text}</p>
          </div>
        ) : (
          <Spin size="large" />
        )}
      </Modal>
    </div>
  );
};

export default ContactsPage;
