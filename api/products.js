const { connectToDatabase } = require('../utils/mongodb');
const { verifyAdmin } = require('../utils/auth');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { db } = await connectToDatabase();
    const productsCollection = db.collection('products');

    // GET products
    if (req.method === 'GET') {
        try {
            let products = await productsCollection.find({}).toArray();

            // If empty database, pre-seed with default products
            if (products.length === 0) {
                const seedData = [
                    { name: 'Premium Black Abaya', price: 3999, image: 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcSZWJrcm0-5_MZMUfnNTO1gWXaWttAsrNB5Ny0u-TZScAPjAHjNSVtZJfJRpIwV0yi_KOZAv1t1nwlxmZ1Ls36-FIufl0eJ', description: 'Experience timeless elegance with our Premium Black Abaya. Crafted from the finest quality fabric, featuring delicate embroidery and a flattering fit.', category: 'Abayas', rating: 4.8 },
                    { name: 'Embroidered Kurti Set', price: 2499, image: 'https://images.pexels.com/photos/35521738/pexels-photo-35521738.jpeg', description: 'A stunning kurti set featuring intricate embroidery work on premium fabric. Paired with matching bottoms and dupatta.', category: 'Kurtis', rating: 4.6 },
                    { name: 'Lace Mermaid Gown', price: 5999, image: 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRQfs-zjNzaZ2RhQpK4TvsLj0EeFi9Yp_K2hWgSX4jD1VVZxcdgERLp0TrC2LLTb20Oi98W7u6tBcgWRnqESV6nEX-tiN4Blw7C3i-FiKfilrvwYg3pPypObA', description: 'A breathtaking mermaid gown with delicate lace detailing. Designed for special occasions, weddings, and formal events.', category: 'Gowns', rating: 4.9 },
                    { name: 'Leather Tote Bag', price: 4499, image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&h=550&fit=crop&crop=center&q=80', description: 'Premium genuine leather tote bag with spacious compartments. Features gold-toned hardware and a sleek design.', category: 'Handbags', rating: 4.7 },
                    { name: 'Gold Plated Jewelry Set', price: 1999, image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=550&fit=crop&crop=center&q=80', description: 'Exquisite gold-plated jewelry set including necklace and earrings. Crafted with precision and care.', category: 'Jewelry', rating: 4.5 },
                    { name: 'Linen Abaya Dress', price: 2999, image: 'https://images.unsplash.com/photo-1485236715568-ddc5ee6cd227?w=400&h=550&fit=crop&crop=center&q=80', description: 'A breezy linen abaya dress perfect for everyday elegance. Lightweight, comfortable, and stylish.', category: 'Abayas', rating: 4.4 },
                    { name: 'Traditional Bangle Set', price: 999, image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=550&fit=crop&crop=center&q=80', description: 'A beautiful set of traditional bangles with intricate designs. Gold and pink tones complement any ethnic outfit.', category: 'Jewelry', rating: 4.3 },
                    { name: 'Luxury Gift Hamper', price: 4999, image: 'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?w=400&h=550&fit=crop&crop=center&q=80', description: 'Our signature luxury gift hamper featuring a curated selection of premium products. Beautifully packaged and ready to gift.', category: 'Gifts', rating: 4.8 },
                    { name: 'Silk Embroidered Abaya', price: 4599, image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=550&fit=crop&crop=center&q=80', description: 'Luxurious silk abaya with intricate embroidery. Perfect for special occasions and festive gatherings.', category: 'Abayas', rating: 4.7 },
                    { name: 'Cotton Kurti Set', price: 1899, image: 'https://images.pexels.com/photos/3735609/pexels-photo-3735609.jpeg?w=400&h=550&fit=crop&crop=center&q=80', description: 'Breathable cotton kurti set with block print design. Comfortable and stylish for everyday wear.', category: 'Kurtis', rating: 4.5 },
                    { name: 'Beaded Evening Gown', price: 7999, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=550&fit=crop&crop=center&q=80', description: 'Stunning evening gown with hand-beaded detailing. A showstopper for weddings and galas.', category: 'Gowns', rating: 4.9 },
                    { name: 'Crossbody Leather Bag', price: 3499, image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&h=550&fit=crop&crop=center&q=80', description: 'Compact crossbody leather bag with adjustable strap. Perfect for on-the-go elegance.', category: 'Handbags', rating: 4.6 }
                ];
                // Insert and give them standard MongoDB _id mapped to id for frontend compatibility
                const seedWithIds = seedData.map((p, index) => ({
                    ...p,
                    id: 'p' + (index + 1)
                }));
                await productsCollection.insertMany(seedWithIds);
                products = await productsCollection.find({}).toArray();
            }

            // Map standard database structure for frontend compatibility: _id to id string
            const formatted = products.map(p => ({
                ...p,
                id: p.id || p._id.toString()
            }));

            return res.status(200).json(formatted);
        } catch (e) {
            return res.status(500).json({ error: 'Failed to retrieve products: ' + e.message });
        }
    }

    // Write operations require Admin
    const admin = verifyAdmin(req);
    if (!admin) {
        return res.status(403).json({ error: 'Admin authorization required' });
    }

    const bodyData = req.body || JSON.parse(req.body || '{}');

    // POST: Add Product
    if (req.method === 'POST') {
        try {
            const { name, price, image, category, description, rating } = bodyData;
            if (!name || !price || !image || !description) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const newProduct = {
                name,
                price: parseFloat(price),
                image,
                category,
                description,
                rating: parseFloat(rating || 4),
                createdAt: new Date()
            };

            const result = await productsCollection.insertOne(newProduct);
            // Include frontend id mapping
            await productsCollection.updateOne({ _id: result.insertedId }, { $set: { id: result.insertedId.toString() } });

            return res.status(201).json({ success: true, message: 'Product added successfully' });
        } catch (e) {
            return res.status(500).json({ error: 'Failed to add product: ' + e.message });
        }
    }

    // PUT: Update Product
    if (req.method === 'PUT') {
        try {
            const { id, name, price, image, category, description } = bodyData;
            if (!id) {
                return res.status(400).json({ error: 'Product ID required' });
            }

            // Find either by string ID or ObjectId
            let query = { id: id };
            if (ObjectId.isValid(id)) {
                query = { $or: [{ _id: new ObjectId(id) }, { id: id }] };
            }

            const updateFields = {
                name,
                price: parseFloat(price),
                image,
                category,
                description,
                updatedAt: new Date()
            };

            await productsCollection.updateOne(query, { $set: updateFields });
            return res.status(200).json({ success: true, message: 'Product updated successfully' });
        } catch (e) {
            return res.status(500).json({ error: 'Failed to update product: ' + e.message });
        }
    }

    // DELETE: Delete Product
    if (req.method === 'DELETE') {
        try {
            const { id } = bodyData;
            if (!id) {
                return res.status(400).json({ error: 'Product ID required' });
            }

            let query = { id: id };
            if (ObjectId.isValid(id)) {
                query = { $or: [{ _id: new ObjectId(id) }, { id: id }] };
            }

            await productsCollection.deleteOne(query);
            return res.status(200).json({ success: true, message: 'Product deleted successfully' });
        } catch (e) {
            return res.status(500).json({ error: 'Failed to delete product: ' + e.message });
        }
    }

    res.status(404).json({ error: 'Method not supported' });
};
