import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import AdminLayout from '../../components/AdminLayout';
import { toast } from 'sonner';
import { Plus, Trash2, X } from 'lucide-react';

export default function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', collection_id: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [catsRes, collsRes] = await Promise.all([
                api.get('/categories'),
                api.get('/collections')
            ]);
            setCategories(catsRes.data);
            setCollections(collsRes.data);
        } catch (error) {
            toast.error('Failed to fetch data');
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
            formDataToSend.append('collection_id', formData.collection_id);

            await api.post('/admin/categories', formDataToSend);
            toast.success('Category created');
            setShowModal(false);
            setFormData({ name: '', collection_id: '' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to create category');
        } finally {
            setSubmitting(false);
        }
    };

    const deleteCategory = async (id) => {
        if (!window.confirm('Delete category?')) return;
        try {
            await api.delete(`/admin/categories/${id}`);
            toast.success('Category deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete category');
        }
    };

    const getCollectionName = (id) => collections.find(c => c.id === id)?.name || id;

    const runSeed = async () => {
        try {
            const res = await api.post('/admin/seed-categories');
            toast.success(res.data.message);
            fetchData();
        } catch (e) {
            toast.error('Seed failed');
        }
    }

    return (
        <AdminLayout>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-bold uppercase tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Categories
                </h1>
                <div className="flex gap-2">
                    <button
                        onClick={runSeed}
                        className="flex items-center gap-2 px-4 py-3 border-2 border-black text-black hover:bg-gray-100 transition-colors text-xs uppercase tracking-widest font-bold"
                    >
                        Seed Defaults
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors text-xs uppercase tracking-widest font-bold"
                    >
                        <Plus className="w-4 h-4" /> Add Category
                    </button>
                </div>
            </div>

            {loading ? <div>Loading...</div> : (
                <div className="border-2 border-black">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-black">
                                <th className="p-4 text-left text-xs uppercase tracking-widest font-bold">Name</th>
                                <th className="p-4 text-left text-xs uppercase tracking-widest font-bold">Collection</th>
                                <th className="p-4 text-left text-xs uppercase tracking-widest font-bold">Slug</th>
                                <th className="p-4 text-left text-xs uppercase tracking-widest font-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((c) => (
                                <tr key={c.id} className="border-b border-black">
                                    <td className="p-4 font-medium">{c.name}</td>
                                    <td className="p-4">{getCollectionName(c.collection_id)}</td>
                                    <td className="p-4">{c.slug}</td>
                                    <td className="p-4">
                                        <button onClick={() => deleteCategory(c.id)} className="text-red-600 hover:bg-gray-100 p-2">
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
                            <h2 className="text-xl font-bold uppercase">New Category</h2>
                            <button onClick={() => setShowModal(false)}><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Collection</label>
                                <select className="w-full border-2 border-black p-2" required
                                    value={formData.collection_id} onChange={e => setFormData({ ...formData, collection_id: e.target.value })}>
                                    <option value="">Select Collection</option>
                                    {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Name</label>
                                <input className="w-full border-2 border-black p-2" required
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <button disabled={submitting} className="w-full bg-black text-white p-3 font-bold uppercase text-xs">
                                {submitting ? 'Saving...' : 'Create Category'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
