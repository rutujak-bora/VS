import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import AdminLayout from '../../components/AdminLayout';
import { toast } from 'sonner';
import { Plus, Trash2, X } from 'lucide-react';

export default function AdminCollections() {
    const navigate = useNavigate();
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCollections();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchCollections = async () => {
        try {
            const response = await api.get('/collections');
            setCollections(response.data);
        } catch (error) {
            toast.error('Failed to fetch collections');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            if (formData.description) formDataToSend.append('description', formData.description);

            await api.post('/admin/collections', formDataToSend);
            toast.success('Collection created');
            setShowModal(false);
            setFormData({ name: '', description: '' });
            fetchCollections();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to create collection');
        } finally {
            setSubmitting(false);
        }
    };

    const deleteCollection = async (id) => {
        if (!window.confirm('Delete collection? This might affect categories/products linked to it.')) return;
        try {
            await api.delete(`/admin/collections/${id}`);
            toast.success('Collection deleted');
            fetchCollections();
        } catch (error) {
            toast.error('Failed to delete collection');
        }
    };

    return (
        <AdminLayout>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-bold uppercase tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Collections
                </h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors text-xs uppercase tracking-widest font-bold"
                >
                    <Plus className="w-4 h-4" /> Add Collection
                </button>
            </div>

            {loading ? <div>Loading...</div> : (
                <div className="border-2 border-black">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-black">
                                <th className="p-4 text-left text-xs uppercase tracking-widest font-bold">Name</th>
                                <th className="p-4 text-left text-xs uppercase tracking-widest font-bold">Slug</th>
                                <th className="p-4 text-left text-xs uppercase tracking-widest font-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {collections.map((c) => (
                                <tr key={c.id} className="border-b border-black">
                                    <td className="p-4 font-medium">{c.name}</td>
                                    <td className="p-4">{c.slug}</td>
                                    <td className="p-4">
                                        <button onClick={() => deleteCollection(c.id)} className="text-red-600 hover:bg-gray-100 p-2">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={() => setShowModal(false)}>
                    <div className="bg-white border-2 border-black max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between mb-4">
                            <h2 className="text-xl font-bold uppercase">New Collection</h2>
                            <button onClick={() => setShowModal(false)}><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Name</label>
                                <input className="w-full border-2 border-black p-2" required
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Description</label>
                                <textarea className="w-full border-2 border-black p-2"
                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <button disabled={submitting} className="w-full bg-black text-white p-3 font-bold uppercase text-xs">
                                {submitting ? 'Saving...' : 'Create Collection'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
