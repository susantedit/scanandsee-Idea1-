import { Router } from 'express';

const router = Router();

const PRODUCTS = [
  { id: 1, name: 'Optimum Nutrition Gold Standard Whey', category: 'Protein', score: 8.8, price: '$54.99', rating: 4.7, reviews: 12400, badge: 'Top Rated', color: 'var(--primary)', why: 'High protein quality, low sugar, no artificial colors', link: 'https://www.amazon.com/s?k=optimum+nutrition+gold+standard+whey' },
  { id: 2, name: 'Orgain Organic Protein', category: 'Protein', score: 8.2, price: '$29.99', rating: 4.5, reviews: 8200, badge: 'Clean Label', color: 'var(--secondary)', why: 'Organic, no artificial sweeteners, good amino profile', link: 'https://www.amazon.com/s?k=orgain+organic+protein' },
  { id: 3, name: 'Creatine Monohydrate (Bulk)', category: 'Supplement', score: 9.1, price: '$19.99', rating: 4.8, reviews: 22000, badge: 'Best Value', color: 'var(--warning)', why: 'Most researched supplement. Pure, no fillers, proven effective', link: 'https://www.amazon.com/s?k=creatine+monohydrate+bulk' },
  { id: 4, name: 'Athletic Greens AG1', category: 'Greens', score: 7.9, price: '$79.99', rating: 4.4, reviews: 5600, badge: 'Premium', color: 'var(--primary)', why: 'Comprehensive micronutrients, good for nutrient gaps', link: 'https://www.amazon.com/s?k=athletic+greens+ag1' },
  { id: 5, name: 'Kirkland Signature Fish Oil', category: 'Omega-3', score: 8.5, price: '$18.99', rating: 4.6, reviews: 31000, badge: 'Best Budget', color: 'var(--secondary)', why: 'High EPA/DHA, third-party tested, excellent value', link: 'https://www.amazon.com/s?k=kirkland+fish+oil' },
  { id: 6, name: 'Magnesium Glycinate 400mg', category: 'Mineral', score: 8.7, price: '$14.99', rating: 4.7, reviews: 9800, badge: 'Sleep & Recovery', color: 'var(--tertiary)', why: 'High bioavailability, supports sleep, muscle recovery, stress', link: 'https://www.amazon.com/s?k=magnesium+glycinate+400mg' },
];

// GET /api/marketplace/products
router.get('/products', (req, res) => {
  res.json({ products: PRODUCTS });
});

export default router;
