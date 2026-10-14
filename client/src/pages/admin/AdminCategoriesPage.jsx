import { adminApi } from '../../api/client';
import { CatalogGroupPage } from '../../components/admin/CatalogGroupPage';

const config = {
  noun: 'Category',
  plural: 'Categories',
  description: 'Shop departments. Visible categories appear in the shop filters and the homepage “Find your silhouette” carousel.',
  queryKey: 'admin-categories',
  list: adminApi.categories,
  create: adminApi.createCategory,
  update: adminApi.updateCategory,
  remove: adminApi.deleteCategory,
  storePath: '/shop',
  imageKey: 'imageUrl',
  imageLabel: 'Category image (carousel tile)',
  aspect: '3 / 4',
  descKey: 'description',
  fields: [
    { key: 'name', label: 'Name', max: 80 },
    { key: 'slug', label: 'Slug', max: 80, hint: 'Leave empty to generate from the name' },
    { key: 'description', label: 'Description', type: 'textarea', max: 600 },
    { key: 'sortOrder', label: 'Display order', type: 'number', hint: 'Lower numbers show first' },
    { key: 'imageUrl', label: 'Image' },
  ],
};

export function AdminCategoriesPage() {
  return <CatalogGroupPage config={config} />;
}
