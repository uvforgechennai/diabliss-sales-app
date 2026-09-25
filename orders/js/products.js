const PRODUCT_CATALOG = [
  {
    id: 'sugar',
    name: 'Low GI Sugar',
    image: null,
    products: [
      { id: 'sugar-40x5g', name: 'Sugar 40x5g Sachet Box', mrp: 99, price: 99, image: 'images/sugar-40x5g.jpg' },
      { id: 'sugar-500g', name: 'Sugar 500g Standy Pouch', mrp: 160, price: 160, image: 'images/sugar-500g.jpg' },
      { id: 'sugar-1kg', name: 'Sugar 1kg PET Jar', mrp: 295, price: 295, image: 'images/sugar-1kg.jpg' },
      { id: 'sugar-1.75kg', name: 'Sugar 1.75kg PET Jar', mrp: 499, price: 499, image: 'images/sugar-1.75kg.jpg' },
      { id: 'sugar-5kg', name: 'Sugar 5kg', mrp: 1250, price: 1250, image: 'images/sugar-5kg.jpg' },
      { id: 'sugar-10kg', name: 'Sugar 10kg', mrp: 2300, price: 2300, image: 'images/sugar-10kg.jpg' }
    ]
  },
  {
    id: 'jaggery',
    name: 'Low GI Jaggery Powder',
    image: null,
    products: [
      { id: 'jaggery-500g', name: 'Jaggery 500g Standy Pouch', mrp: 160, price: 160, image: 'images/jaggery-500g.jpg' },
      { id: 'jaggery-750g', name: 'Jaggery 750g PET Jar', mrp: 225, price: 225, image: 'images/jaggery-750g.jpg' },
      { id: 'jaggery-1.25kg', name: 'Jaggery 1.25kg PET Jar', mrp: 365, price: 365, image: 'images/jaggery-1.25kg.jpg' },
      { id: 'jaggery-5kg', name: 'Jaggery 5kg Bag', mrp: 1250, price: 1250, image: 'images/jaggery-5kg.jpg' }
    ]
  },
  {
    id: 'tea',
    name: 'Tea Premix',
    image: null,
    products: [
      { id: 'tea-lemon-10x10g', name: 'Lemon Tea 10x10g', mrp: 76, price: 76, image: 'images/tea-lemon-10x10g.jpg' },
      { id: 'tea-lemon-30x10g', name: 'Lemon Tea 30x10g', mrp: 201, price: 201, image: 'images/tea-lemon-30x10g.jpg' },
      { id: 'tea-lemon-500g', name: 'Lemon Tea 500g', mrp: 241, price: 241, image: 'images/tea.jpg' },
      { id: 'tea-combo-30x10g', name: 'Combo Tea 30x10g', mrp: 223, price: 223, image: 'images/tea-combo-30x10g.jpg' },
      { id: 'tea-ginger-10x10g', name: 'Ginger Tea 10x10g', mrp: 89, price: 89, image: 'images/tea-ginger-10x10g.jpg' },
      { id: 'tea-masala-10x10g', name: 'Masala Chai 10x10g', mrp: 89, price: 89, image: 'images/tea-masala-10x10g.jpg' }
    ]
  },
  {
    id: 'cookies',
    name: 'Millet Cookies',
    image: null,
    products: [
      { id: 'cookies-millets-120g', name: 'Millets Cookies 120g', mrp: 80, price: 80, image: 'images/cookies-millets-120g.jpg' },
      { id: 'cookies-moringa-120g', name: 'Millets with Moringa Leaves Cookies 120g', mrp: 89, price: 89, image: 'images/cookies-moringa-120g.jpg' },
      { id: 'cookies-chia-120g', name: 'Millets with Chia Seeds Cookies 120g', mrp: 89, price: 89, image: 'images/cookies-chia-120g.jpg' }
    ]
  },
  {
    id: 'jam',
    name: 'Fruit Jam',
    image: null,
    products: [
      { id: 'jam-mixed-fruit-225g', name: 'Mixed Fruit Jam 225g', mrp: 215, price: 215, image: 'images/jam-mixed-fruit-225g.jpg' },
      { id: 'jam-guava-225g', name: 'Guava Jam 225g', mrp: 225, price: 225, image: 'images/jam-guava-225g.jpg' },
      { id: 'jam-pineapple-ginger-225g', name: 'Pineapple Ginger Jam 225g', mrp: 235, price: 235, image: 'images/jam-pineapple-ginger-225g.jpg' }
    ]
  },
  {
    id: 'halwa-kheer',
    name: 'Halwa & Kheer Premix',
    image: null,
    products: [
      { id: 'halwa-moong-dhal-225g', name: 'Moong Dhal Halwa 225g', mrp: 240, price: 240, image: 'images/halwa-moong-dhal-225g.jpg' },
      { id: 'halwa-whole-wheat-225g', name: 'Whole Wheat Halwa 225g', mrp: 199, price: 199, image: 'images/halwa-whole-wheat-225g.jpg' },
      { id: 'kheer-basmati-rice-225g', name: 'Basmati Rice Kheer 225g', mrp: 199, price: 199, image: 'images/kheer-basmati-rice-225g.jpg' },
      { id: 'kheer-vermicilli-225g', name: 'Vermicilli Kheer 225g', mrp: 199, price: 199, image: 'images/kheer-vermicilli-225g.jpg' }
    ]
  },
  {
    id: 'herbal-waters',
    name: 'Herbal Waters',
    subtitle: '500ml, 30 days supply',
    image: null,
    products: [
      { id: 'hw-glucose', name: 'Herbal Water - Blood Glucose Support', mrp: 450, price: 450, image: 'images/hw-glucose.jpg' },
      { id: 'hw-bp', name: 'Herbal Water - BP Support', mrp: 450, price: 450, image: 'images/hw-bp.jpg' },
      { id: 'hw-hair', name: 'Herbal Water - Hair Care', mrp: 675, price: 675, image: 'images/hw-hair.jpg' },
      { id: 'hw-skin', name: 'Herbal Water - Skin Care', mrp: 675, price: 675, image: 'images/hw-skin.jpg' },
      { id: 'hw-immunity', name: 'Herbal Water - Immunity', mrp: 400, price: 400, image: 'images/hw-immunity.jpg' }
    ]
  }
];
