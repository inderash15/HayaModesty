const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

if (fs.existsSync(path.join(__dirname, '..', '.env'))) {
    const dotenv = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
    dotenv.split('\n').forEach(line => {
        const parts = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (parts) {
            const key = parts[1];
            let value = parts[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            process.env[key] = value;
        }
    });
}

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const db = client.db();
        const productsCollection = db.collection('products');
        
        console.log('Querying products...');
        let products = await productsCollection.find({}).toArray();
        console.log('Found products count:', products.length);
        
        if (products.length === 0) {
            console.log('Pre-seeding products...');
            const seedData = [
                { id: 'p1', name: 'Premium Black Abaya', price: 3999, image: 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcSZWJrcm0-5_MZMUfnNTO1gWXaWttAsrNB5Ny0u-TZScAPjAHjNSVtZJfJRpIwV0yi_KOZAv1t1nwlxmZ1Ls36-FIufl0eJ', description: 'Experience timeless elegance with our Premium Black Abaya. Crafted from the finest quality fabric, featuring delicate embroidery and a flattering fit.', category: 'Abayas', rating: 4.8 },
                { id: 'p2', name: 'Embroidered Kurti Set', price: 2499, image: 'https://images.pexels.com/photos/35521738/pexels-photo-35521738.jpeg', description: 'A stunning kurti set featuring intricate embroidery work on premium fabric. Paired with matching bottoms and dupatta.', category: 'Kurtis', rating: 4.6 }
            ];
            await productsCollection.insertMany(seedData);
            products = await productsCollection.find({}).toArray();
            console.log('Seeded database! Products count:', products.length);
        }
        
        console.log('Products:', JSON.stringify(products, null, 2));
    } catch (e) {
        console.error('Error during run:', e);
    } finally {
        await client.close();
    }
}

run();
