/**
 * Udbhav launch catalog — polished copy + Unsplash editorial stand-ins.
 * Images are Unsplash License (free commercial use). Replace with brand
 * photography / Cloudinary assets before production launch.
 * Pinterest/Google scrapes are avoided (copyright); mood matches product types.
 */

const img = (photoId) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=900&h=1200&q=80`;

export const CARE_STANDARD = 'COLD WASH. LOW DRAMA. Turn inside out. Do not bleach. Line dry preferred.';

export const SIZE_GUIDE_TOP =
  'Unisex sizing. Chest (inches): S 38–40 · M 40–42 · L 42–44 · XL 44–46. If between sizes, size up for the intended oversized drop.';

export const SIZE_GUIDE_BOTTOM =
  'Unisex waist (inches): S 28–30 · M 30–32 · L 32–34 · XL 34–36. Rise sits mid; length designed for a slight break. Check REBEL length notes on PDP.';

export const SHIPPING_NOTE =
  'Ships in 3–5 business days within India. Free standard shipping on Udbhav launch pieces. Easy exchanges — see Returns.';

export const categories = [
  { name: 'Shirts', slug: 'shirts', sortOrder: 1 },
  { name: 'T-Shirts', slug: 't-shirts', sortOrder: 2 },
  { name: 'Bottoms', slug: 'bottoms', sortOrder: 3 },
  { name: 'Sets', slug: 'sets', sortOrder: 4 },
];

/**
 * Each product uses a consistent shape:
 * name, title, slug, category, price, colours[], images[], features[],
 * description, details, fabric, fit, care, modelInfo, sizeGuide, seo, …
 */
export const productsSpec = [
  {
    name: 'AARAMBH',
    title: 'Ivory Zip Shirt',
    slug: 'aarambh-ivory-zip-shirt',
    category: 'shirts',
    price: 5490,
    isNewArrival: true,
    isBestseller: true,
    fit: 'Oversized — dropped shoulder, roomy body',
    fabric: 'Premium cotton-twill blend, soft hand-feel with structured drape',
    care: CARE_STANDARD,
    modelInfo: "Model 6'0\" / wears L. Intended oversized — size down for closer fit.",
    sizeGuide: SIZE_GUIDE_TOP,
    description:
      'AARAMBH is the beginning made wearable — an oversized ivory short-sleeve zip shirt carrying the Shunya artwork. Clean lines up front, personality in the graphic. Minimal on the surface. Attitude in the details.',
    details:
      'Half-zip placket with metal pull. Short sleeves with clean hem. Front Shunya graphic placement. Contrast zipper tape. Unisex cut for layering or solo wear. Designed as a statement shirt, not a basic.',
    features: [
      'Half-zip front with durable metal hardware',
      'Shunya artwork — front graphic placement',
      'Oversized unisex silhouette',
      'Ivory seasonal colourway',
      'Mid-weight cotton-twill for year-round wear',
    ],
    colours: [{ colourName: 'Ivory', colourHex: '#F5F0E6', stock: 14 }],
    images: [
      { url: img('photo-1594938298603-c8148c4dae35'), alt: 'AARAMBH Ivory Zip Shirt — front', kind: 'front' },
      { url: img('photo-1620799140408-edc6dcb6d633'), alt: 'AARAMBH Ivory Zip Shirt — texture', kind: 'detail' },
      { url: img('photo-1487222477894-8943e31ef7b2'), alt: 'AARAMBH Ivory Zip Shirt — model', kind: 'model' },
    ],
    seo: {
      title: 'AARAMBH Ivory Zip Shirt | Oversized Cotton | TheRuux Udbhav',
      description:
        'Shop AARAMBH — oversized ivory zip shirt with Shunya artwork from TheRuux Udbhav collection. Premium cotton-twill. Sizes S–XL.',
      keywords:
        'AARAMBH, ivory zip shirt, oversized shirt, TheRuux, Udbhav, Shunya, premium streetwear India',
    },
    namingNote:
      'PROVISIONAL: article pages use AARAMBH; naming system page uses ARAMBH.',
  },
  {
    name: 'RAFTAAR',
    title: 'Indigo Racing Denim Shirt',
    slug: 'raftaar-indigo-racing-denim-shirt',
    category: 'shirts',
    price: 5490,
    isNewArrival: true,
    isBestseller: true,
    fit: 'Relaxed — athletic ease through chest and sleeve',
    fabric: 'Washed indigo denim, mid-weight with soft break-in',
    care: CARE_STANDARD,
    modelInfo: "Model 6'0\" / wears L.",
    sizeGuide: SIZE_GUIDE_TOP,
    description:
      'RAFTAAR moves like purpose with speed — an indigo half-zip denim shirt with white collar contrast, sleeve straps, and racing energy. Built for the chase, finished for the street.',
    details:
      'Half-zip denim body. Contrast white collar. Adjustable sleeve straps. Racing-inspired graphic treatment. Reinforced stitching at stress points. Pair with REBEL or standalone over a tee.',
    features: [
      'Indigo washed denim construction',
      'Contrast white collar',
      'Sleeve strap detailing',
      'Half-zip entry',
      'Racing graphic motif',
    ],
    colours: [{ colourName: 'Indigo', colourHex: '#2C3E6B', stock: 12 }],
    images: [
      { url: img('photo-1495107334309-fcf20504a5ab'), alt: 'RAFTAAR Indigo Racing Denim Shirt — front', kind: 'front' },
      { url: img('photo-1582418702059-97ebafb35d09'), alt: 'RAFTAAR Indigo Racing Denim Shirt — denim detail', kind: 'detail' },
      { url: img('photo-1617137968427-85924c800a22'), alt: 'RAFTAAR Indigo Racing Denim Shirt — styled', kind: 'model' },
    ],
    seo: {
      title: 'RAFTAAR Indigo Racing Denim Shirt | TheRuux Udbhav',
      description:
        'Shop RAFTAAR — indigo racing denim half-zip shirt with contrast collar and sleeve straps. Udbhav collection by TheRuux.',
      keywords:
        'RAFTAAR, indigo denim shirt, racing shirt, half zip denim, TheRuux, Udbhav, streetwear',
    },
    namingNote:
      'PROVISIONAL: article pages use RAFTAAR; naming system page uses DHAAV (same title).',
  },
  {
    name: 'LIMITLESS',
    title: 'Indigo Denim Shirt & Shorts Set',
    slug: 'limitless-indigo-denim-set',
    category: 'sets',
    price: 5490,
    isNewArrival: true,
    isBestseller: false,
    fit: 'Oversized shirt + utility shorts — coordinated volume',
    fabric: 'Matching indigo denim across both pieces',
    care: CARE_STANDARD,
    modelInfo: "Model 6'0\" / wears L (shirt) and M (shorts).",
    sizeGuide: `${SIZE_GUIDE_TOP} Shorts: ${SIZE_GUIDE_BOTTOM}`,
    description:
      'LIMITLESS is the full look — an indigo denim shirt and utility shorts set united by Limitless artwork. One decision. Two pieces. Zero second-guessing.',
    details:
      'Two-piece set sold together. Oversized denim shirt with artwork. Utility shorts with functional pockets and matching wash. Designed to be worn as a set; pieces separate cleanly with neutrals.',
    features: [
      'Coordinated shirt + utility shorts',
      'Matching indigo denim wash',
      'Limitless artwork placement',
      'Utility pocketing on shorts',
      'Unisex set sizing S–XL',
    ],
    colours: [{ colourName: 'Indigo', colourHex: '#2C3E6B', stock: 10 }],
    images: [
      { url: img('photo-1515886657613-9f3515b0c78f'), alt: 'LIMITLESS Indigo Denim Set — look', kind: 'model' },
      { url: img('photo-1495107334309-fcf20504a5ab'), alt: 'LIMITLESS Indigo Denim Set — shirt', kind: 'front' },
      { url: img('photo-1473966968600-fa801b869a1a'), alt: 'LIMITLESS Indigo Denim Set — shorts detail', kind: 'detail' },
    ],
    seo: {
      title: 'LIMITLESS Indigo Denim Shirt & Shorts Set | TheRuux',
      description:
        'Shop LIMITLESS — indigo denim shirt and utility shorts set from TheRuux Udbhav. Coordinated wash, artwork, unisex sizes.',
      keywords:
        'LIMITLESS, denim set, shirt and shorts, indigo denim, TheRuux, Udbhav, co-ord set',
    },
    namingNote:
      'PROVISIONAL: article pages use LIMITLESS; naming system page uses ASEEM.',
  },
  {
    name: 'REBIRTH',
    title: 'Black Snake Puff Print T-Shirt',
    slug: 'rebirth-black-snake-puff-tee',
    category: 't-shirts',
    price: 5490,
    isNewArrival: true,
    isBestseller: true,
    fit: 'Oversized — heavy drape, extended sleeve',
    fabric: '240 GSM cotton jersey — dense, smooth face for puff print',
    care: CARE_STANDARD,
    modelInfo: "Model 5'11\" / wears M for oversized look.",
    sizeGuide: SIZE_GUIDE_TOP,
    description:
      'REBIRTH sheds the old skin — a black oversized tee with a raised blue serpent puff print. Soft body. Bold graphic. Transformation you can wear.',
    details:
      'Crew neck with rib finish. Oversized body and sleeve. Front puff-print serpent artwork in electric blue. High-density ink for dimensional hand-feel. Pre-shrunk jersey.',
    features: [
      'Raised puff-print serpent artwork',
      '240 GSM premium cotton jersey',
      'Oversized unisex cut',
      'Ribbed crew neck',
      'Pre-shrunk for shape retention',
    ],
    colours: [
      { colourName: 'Black', colourHex: '#111111', stock: 16 },
      { colourName: 'Bone', colourHex: '#E8E2D6', stock: 8 },
    ],
    images: [
      { url: img('photo-1503341504253-dff4815485f1'), alt: 'REBIRTH Black Snake Puff Print Tee — front', kind: 'front' },
      { url: img('photo-1583743814966-8936f5b7be1a'), alt: 'REBIRTH Black Snake Puff Print Tee — back', kind: 'back' },
      { url: img('photo-1576566588028-4147f3842f27'), alt: 'REBIRTH Black Snake Puff Print Tee — graphic', kind: 'artwork' },
    ],
    seo: {
      title: 'REBIRTH Black Snake Puff Print T-Shirt | TheRuux Udbhav',
      description:
        'Shop REBIRTH — oversized black tee with blue serpent puff print. 240 GSM cotton. Available in Black and Bone. TheRuux Udbhav.',
      keywords:
        'REBIRTH, puff print tee, snake graphic t-shirt, oversized tee, TheRuux, Udbhav, streetwear India',
    },
  },
  {
    name: 'REBEL',
    title: 'Indigo Strapped Embellished Denim Jeans',
    slug: 'rebel-indigo-strapped-jeans',
    category: 'bottoms',
    price: 5490,
    isNewArrival: false,
    isBestseller: true,
    fit: 'Straight leg — mid rise with intentional length',
    fabric: 'Rigid-to-soft indigo denim with embossed surface interest',
    care: CARE_STANDARD,
    modelInfo: "Model 6'0\" / wears M. Inseam approx. 32\".",
    sizeGuide: SIZE_GUIDE_BOTTOM,
    description:
      'REBEL does not ask permission — indigo jeans with studs, straps, and embossed pattern work. Hardware where it matters. Denim that holds a point of view.',
    details:
      'Straight silhouette. Embossed denim panels. Metal stud accents. Functional strap hardware. Five-pocket foundation with elevated detailing. Designed as a statement bottom for RAFTAAR or a graphic tee.',
    features: [
      'Embossed denim patterning',
      'Metal stud embellishment',
      'Strap hardware details',
      'Straight unisex cut',
      'Indigo wash with depth',
    ],
    colours: [{ colourName: 'Indigo', colourHex: '#2C3E6B', stock: 11 }],
    images: [
      { url: img('photo-1541099649105-f69ad21f3246'), alt: 'REBEL Indigo Strapped Jeans — front', kind: 'front' },
      { url: img('photo-1542272604-787c3835535d'), alt: 'REBEL Indigo Strapped Jeans — denim stack', kind: 'detail' },
      { url: img('photo-1473966968600-fa801b869a1a'), alt: 'REBEL Indigo Strapped Jeans — wear', kind: 'model' },
    ],
    seo: {
      title: 'REBEL Indigo Strapped Embellished Denim Jeans | TheRuux',
      description:
        'Shop REBEL — indigo embellished jeans with studs, straps, and embossed denim. Straight fit. Udbhav by TheRuux.',
      keywords:
        'REBEL, embellished jeans, strapped denim, indigo jeans, TheRuux, Udbhav, statement denim',
    },
  },
  {
    name: 'IDENTITY',
    title: 'Custom DTF Print Oversized T-Shirt',
    slug: 'identity-custom-dtf-tee',
    category: 't-shirts',
    price: 5490,
    isNewArrival: false,
    isBestseller: false,
    allowsPersonalization: true,
    fit: 'Oversized — blank canvas proportion',
    fabric: '220 GSM cotton jersey — smooth face for DTF adhesion',
    care: CARE_STANDARD,
    modelInfo: "Model 5'11\" / wears L.",
    sizeGuide: SIZE_GUIDE_TOP,
    description:
      'IDENTITY is yours to finish — an oversized tee built for custom DTF text front and back, with stud accents that stay sharp. Make it yours. Wear it loud.',
    details:
      'Crew neck oversized tee. Optional front text (required at checkout) and optional back text. DTF print process for crisp lettering. Subtle stud detailing on shoulder/placket zone. Available in Black and Ivory bases.',
    features: [
      'Custom front DTF text (required)',
      'Optional back text',
      'Stud accent detailing',
      '220 GSM cotton jersey',
      'Oversized unisex blank',
    ],
    colours: [
      { colourName: 'Black', colourHex: '#111111', stock: 20 },
      { colourName: 'Ivory', colourHex: '#F5F0E6', stock: 14 },
    ],
    images: [
      { url: img('photo-1521572163474-6864f9cf17ab'), alt: 'IDENTITY Custom DTF Tee — black front', kind: 'front' },
      { url: img('photo-1618354691373-d851c5c3a990'), alt: 'IDENTITY Custom DTF Tee — blank detail', kind: 'detail' },
      { url: img('photo-1602810318383-e386cc2a3ccf'), alt: 'IDENTITY Custom DTF Tee — colours', kind: 'other' },
    ],
    seo: {
      title: 'IDENTITY Custom DTF Oversized T-Shirt | Personalize | TheRuux',
      description:
        'Shop IDENTITY — customizable oversized tee with DTF front/back text and stud details. Black or Ivory. TheRuux Udbhav.',
      keywords:
        'IDENTITY, custom t-shirt, DTF print, personalized tee, oversized t-shirt, TheRuux, Udbhav',
    },
  },
];

export const collectionHeroImage = img('photo-1551028719-00167b16eac5');
