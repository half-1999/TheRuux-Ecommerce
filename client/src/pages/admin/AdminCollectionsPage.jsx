import { adminApi } from '../../api/client';
import { CatalogGroupPage } from '../../components/admin/CatalogGroupPage';

const config = {
  noun: 'Collection',
  plural: 'Collections',
  description: 'Curated drops and stories. Assign products from the product editor.',
  queryKey: 'admin-collections',
  list: adminApi.collections,
  create: adminApi.createCollection,
  update: adminApi.updateCollection,
  remove: adminApi.deleteCollection,
  storePath: '/collections',
  imageKey: 'heroMediaUrl',
  imageLabel: 'Hero image',
  aspect: '16 / 9',
  descKey: 'tagline',
  fields: [
    { key: 'name', label: 'Name', max: 80 },
    { key: 'slug', label: 'Slug', max: 80, hint: 'Leave empty to generate from the name' },
    { key: 'tagline', label: 'Tagline', max: 200 },
    { key: 'conceptLine', label: 'Concept line', max: 120 },
    { key: 'story', label: 'Story', type: 'textarea', max: 4000 },
    { key: 'sortOrder', label: 'Display order', type: 'number' },
    { key: 'heroMediaUrl', label: 'Hero image' },
  ],
};

export function AdminCollectionsPage() {
  return <CatalogGroupPage config={config} />;
}
