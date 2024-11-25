import { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Space,
    message,
    Popconfirm
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import { adminUrl } from '../../../utils/const';

const Organization = () => {
    const [organizations, setOrganizations] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    // Fetch organizations
    const fetchOrganizations = async () => {
        setLoading(true);
        try {
            console.log(adminUrl)
            const response = await axios.get(`${adminUrl}/organizations`);
            console.log(response)
            const dataWithIndex = response.data.map((org, index) => ({
                ...org,
                key: org._id,
                sno: index + 1
            }));
            setOrganizations(dataWithIndex);
        } catch (error) {
            console.log(error)
            message.error('Failed to fetch organizations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrganizations();
    }, []);

    // Handle create/edit
    const handleSubmit = async (values) => {
        setSubmitLoading(true);
        try {
            if (editingId) {
                await axios.put(`${adminUrl}/organizations/${editingId}`, values);
                message.success('Organization updated successfully');
            } else {
                await axios.post(`${adminUrl}/organizations`, values);
                message.success('Organization created successfully');
            }
            setIsModalOpen(false);
            form.resetFields();
            setEditingId(null);
            fetchOrganizations();
        } catch (error) {
            message.error('Operation failed');
        } finally {
            setSubmitLoading(false);
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        try {
            await axios.delete(`${adminUrl}/organizations/${id}`);
            message.success('Organization deleted successfully');
            fetchOrganizations();
        } catch (error) {
            message.error('Delete failed');
        }
    };

    const columns = [
        {
            title: 'S.No',
            dataIndex: 'sno',
            key: 'sno',
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <EditOutlined
                        onClick={() => {
                            setEditingId(record._id);
                            form.setFieldsValue(record);
                            setIsModalOpen(true);
                        }}
                    />
                    <Popconfirm
                        title="Are you sure?"
                        onConfirm={() => handleDelete(record._id)}
                    >
                        <DeleteOutlined />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                    setEditingId(null);
                    form.resetFields();
                    setIsModalOpen(true);
                }}
                style={{ marginBottom: '16px' }}
            >
                Create Organization
            </Button>

            <Table 
                columns={columns} 
                dataSource={organizations} 
                loading={loading}
            />

            <Modal
                title={editingId ? 'Edit Organization' : 'Create Organization'}
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    form.resetFields();
                    setEditingId(null);
                }}
                footer={null}
            >
                <Form form={form} onFinish={handleSubmit} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Organization Name"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <Input.TextArea />
                    </Form.Item>
                    <Form.Item>
                        <Button 
                            type="primary" 
                            htmlType="submit"
                            loading={submitLoading}
                        >
                            {editingId ? 'Update' : 'Submit'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Organization;